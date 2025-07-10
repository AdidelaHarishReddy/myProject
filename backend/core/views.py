from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance
from django.db.models import Count
from django.contrib.gis.db.models.functions import Distance as DistanceFunc
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import User, Property, Shortlist, IndiaLocation
from .serializers import (
    UserSerializer, UserRegisterSerializer, UserLoginSerializer,
    OTPSerializer, ResendOTPSerializer, PropertySerializer,
    IndiaLocationSerializer, ShortlistSerializer
)
from django.contrib.auth import login, logout
from rest_framework.authtoken.models import Token
import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = user.generate_otp()
            # Send OTP via SMS or Email
            self.send_otp(user.phone, otp)
            return Response({
                'message': 'User registered successfully. Please verify OTP.',
                'phone': user.phone
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def send_otp(self, phone, otp):
        # Implement SMS sending logic (Twilio, etc.)
        # Or email if user provided email
        print(f"OTP for {phone}: {otp}")  # For development only

class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp = serializer.validated_data['otp']
            
            try:
                user = User.objects.get(phone=phone)
                if user.verify_otp(otp):
                    token, created = Token.objects.get_or_create(user=user)
                    return Response({
                        'message': 'OTP verified successfully',
                        'token': token.key,
                        'user': UserSerializer(user).data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {'message': 'Invalid OTP or expired'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except User.DoesNotExist:
                return Response(
                    {'message': 'User not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            
            try:
                user = User.objects.get(phone=phone)
                otp = user.generate_otp()
                # Resend OTP via SMS or Email
                self.send_otp(user.phone, otp)
                return Response({
                    'message': 'OTP resent successfully',
                    'phone': user.phone
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response(
                    {'message': 'User not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def send_otp(self, phone, otp):
        print(f"New OTP for {phone}: {otp}")  # For development only

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'property_type': ['exact'],
        'location__state': ['exact'],
        'location__district': ['exact'],
        'location__sub_district': ['exact'],
        'location__village': ['exact'],
        'location__pin_code': ['exact'],
        'price': ['gte', 'lte'],
        'area': ['gte', 'lte'],
    }

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return []

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            shortlisted_by_count=Count('shortlisted_by')
        ).select_related('location', 'seller').prefetch_related('images')
        
        # Location-based filtering (10km radius)
        user_location = self.request.user.location if self.request.user.is_authenticated else None
        if user_location:
            queryset = queryset.filter(
                geo_location__distance_lte=(user_location, Distance(km=10)))
            queryset = queryset.annotate(
                distance=DistanceFunc('geo_location', user_location)
            )
        
        # Property type specific filtering
        property_type = self.request.query_params.get('property_type')
        if property_type == 'AGRICULTURE':
            queryset = queryset.filter(area__gte=0, area__lte=100)
        elif property_type == 'OPEN_PLOT':
            queryset = queryset.filter(area__gte=10, area__lte=2000)
        elif property_type == 'FLAT':
            queryset = queryset.filter(area__gte=100, area__lte=10000)
        elif property_type == 'HOUSE':
            queryset = queryset.filter(area__gte=10, area__lte=2000)
        elif property_type == 'BUILDING':
            queryset = queryset.filter(area__gte=50, area__lte=1000)
        elif property_type == 'COMMERCIAL':
            queryset = queryset.filter(area__gte=100, area__lte=10000)
        
        # Sorting
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'price_low':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort_by == 'distance' and user_location:
            queryset = queryset.order_by('distance')
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def shortlist(self, request, pk=None):
        property = self.get_object()
        Shortlist.objects.get_or_create(
            buyer=request.user,
            property=property
        )
        return Response({'status': 'shortlisted'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def remove_shortlist(self, request, pk=None):
        property = self.get_object()
        Shortlist.objects.filter(
            buyer=request.user,
            property=property
        ).delete()
        return Response({'status': 'removed from shortlist'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def shortlisted(self, request):
        shortlisted = Shortlist.objects.filter(buyer=request.user)
        page = self.paginate_queryset(shortlisted)
        if page is not None:
            serializer = ShortlistSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ShortlistSerializer(shortlisted, many=True)
        return Response(serializer.data)

class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = IndiaLocation.objects.all()
    serializer_class = IndiaLocationSerializer
    
    @action(detail=False, methods=['get'])
    def states(self, request):
        states = IndiaLocation.objects.values_list('state', flat=True).distinct()
        return Response({'states': list(states)})
    
    @action(detail=False, methods=['get'])
    def districts(self, request):
        state = request.query_params.get('state')
        districts = IndiaLocation.objects.filter(state=state) \
            .values_list('district', flat=True).distinct()
        return Response({'districts': list(districts)})
    
    @action(detail=False, methods=['get'])
    def sub_districts(self, request):
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        sub_districts = IndiaLocation.objects.filter(
            state=state, 
            district=district
        ).values_list('sub_district', flat=True).distinct()
        return Response({'sub_districts': list(sub_districts)})
    
    @action(detail=False, methods=['get'])
    def villages(self, request):
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        sub_district = request.query_params.get('sub_district')
        villages = IndiaLocation.objects.filter(
            state=state,
            district=district,
            sub_district=sub_district
        ).values_list('village', flat=True).distinct()
        return Response({'villages': list(villages)})
    
    @action(detail=False, methods=['get'])
    def pin_codes(self, request):
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        sub_district = request.query_params.get('sub_district')
        village = request.query_params.get('village')
        
        query = IndiaLocation.objects.all()
        if state: query = query.filter(state=state)
        if district: query = query.filter(district=district)
        if sub_district: query = query.filter(sub_district=sub_district)
        if village: query = query.filter(village=village)
        
        pin_codes = query.values_list('pin_code', flat=True).distinct()
        return Response({'pin_codes': list(pin_codes)})

class ShortlistViewSet(viewsets.ModelViewSet):
    serializer_class = ShortlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Shortlist.objects.filter(buyer=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)
