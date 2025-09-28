# Try to import GIS modules, fallback if not available
try:
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import Distance
    from django.contrib.gis.db.models.functions import Distance as DistanceFunc
    GIS_AVAILABLE = True
except ImportError:
    GIS_AVAILABLE = False
    Point = None
    Distance = None
    DistanceFunc = None

from django.db.models import Count
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
    PropertyCreateSerializer, IndiaLocationSerializer, ShortlistSerializer,
    UserProfileUpdateSerializer
)
from django.contrib.auth import login, logout
from rest_framework.authtoken.models import Token
import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework.permissions import AllowAny

class TestView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'message': 'Backend is working!',
            'timestamp': timezone.now().isoformat(),
            'request_origin': request.META.get('HTTP_ORIGIN', 'Unknown')
        })

class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(f"Registration request data: {request.data}")
        print(f"Request headers: {request.headers}")
        
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            print("Serializer is valid, creating user...")
            user = serializer.save()
            otp = user.generate_otp()
            # Send OTP via SMS or Email
            self.send_otp(user.phone, otp)
            print(f"User created successfully: {user.username}")
            return Response({
                'message': 'User registered successfully. Please verify OTP.',
                'phone': user.phone,
                'otp': otp
            }, status=status.HTTP_201_CREATED)
        else:
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def send_otp(self, phone, otp):
        # Implement SMS sending logic (Twilio, etc.)
        # Or email if user provided email
        print(f"OTP for {phone}: {otp}")  # For development only

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]
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

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return updated user data
            user_serializer = UserSerializer(request.user)
            return Response(user_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'property_type': ['exact'],
        'price': ['gte', 'lte'],
        'area': ['gte', 'lte'],
        # Location filtering will be handled manually in get_queryset
        # 'location__state': ['exact'],
        # 'location__district': ['exact'],
        # 'location__sub_district': ['exact'],
        # 'location__village': ['exact'],
        # 'location__pin_code': ['exact'],
    }

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return []

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyCreateSerializer
        return PropertySerializer

    def get_queryset(self):
        try:
            # Debug: Log query parameters
            print(f"PropertyViewSet query params: {self.request.query_params}")
            
            queryset = super().get_queryset()
            print(f"Base queryset: {queryset}")
            
            # Filter by user if 'my_properties' parameter is present
            if self.request.query_params.get('my_properties') == 'true' and self.request.user.is_authenticated:
                queryset = queryset.filter(seller=self.request.user)
                print(f"Filtered to user properties: {queryset}")
            
            # Remove the conflicting annotation since Property model already has shortlisted_by_count property
            queryset = queryset.select_related('location', 'seller').prefetch_related('images')
            print(f"After select_related: {queryset}")
            
            # Property type specific filtering
            property_type = self.request.query_params.get('property_type')
            if property_type and property_type != '':
                print(f"Before filtering - Total properties: {queryset.count()}")
                print(f"Property type choices: {[choice[0] for choice in Property.PROPERTY_TYPES]}")
                print(f"Filtering by property type: {property_type}")
                
                # Check if the property type exists in choices
                valid_types = [choice[0] for choice in Property.PROPERTY_TYPES]
                if property_type in valid_types:
                    queryset = queryset.filter(property_type=property_type)
                    print(f"After filtering - Properties with type {property_type}: {queryset.count()}")
                    
                    # Debug: Show some sample properties
                    sample_properties = list(queryset[:3])
                    for prop in sample_properties:
                        print(f"Sample property: ID={prop.id}, Type={prop.property_type}, Title={prop.title}")
                else:
                    print(f"Invalid property type: {property_type}")
                    print(f"Valid types are: {valid_types}")
            
            # Price filtering
            price_gte = self.request.query_params.get('price__gte')
            if price_gte and price_gte != '0':
                queryset = queryset.filter(price__gte=price_gte)
                print(f"Filtered by price >= {price_gte}")
            
            price_lte = self.request.query_params.get('price__lte')
            if price_lte and price_lte != '10000000':
                queryset = queryset.filter(price__lte=price_lte)
                print(f"Filtered by price <= {price_lte}")
            
            # Area filtering
            area_gte = self.request.query_params.get('area__gte')
            if area_gte and area_gte != '0':
                queryset = queryset.filter(area__gte=area_gte)
                print(f"Filtered by area >= {area_gte}")
            
            area_lte = self.request.query_params.get('area__lte')
            if area_lte and area_lte != '10000':
                queryset = queryset.filter(area__lte=area_lte)
                print(f"Filtered by area <= {area_lte}")
            
            # Manual location filtering
            location_state = self.request.query_params.get('location__state')
            if location_state:
                queryset = queryset.filter(location__state=location_state)
            
            location_district = self.request.query_params.get('location__district')
            if location_district:
                queryset = queryset.filter(location__district=location_district)
            
            location_sub_district = self.request.query_params.get('location__sub_district')
            if location_sub_district:
                queryset = queryset.filter(location__sub_district=location_sub_district)
            
            location_village = self.request.query_params.get('location__village')
            if location_village:
                queryset = queryset.filter(location__village=location_village)
            
            location_pin_code = self.request.query_params.get('location__pin_code')
            if location_pin_code:
                queryset = queryset.filter(location__pin_code=location_pin_code)
            
            # Sorting
            sort_by = self.request.query_params.get('sort_by')
            if sort_by == 'price_low':
                queryset = queryset.order_by('price')
            elif sort_by == 'price_high':
                queryset = queryset.order_by('-price')
            elif sort_by == 'area_low':
                queryset = queryset.order_by('area')
            elif sort_by == 'area_high':
                queryset = queryset.order_by('-area')
            elif sort_by == 'oldest':
                queryset = queryset.order_by('created_at')
            else:  # newest (default)
                queryset = queryset.order_by('-created_at')
            
            print(f"Final queryset: {queryset}")
            return queryset
        except Exception as e:
            print(f"Error in PropertyViewSet.get_queryset: {e}")
            import traceback
            traceback.print_exc()
            # Return a basic queryset if there's an error
            try:
                return Property.objects.all().select_related('location', 'seller').prefetch_related('images')
            except Exception as fallback_error:
                print(f"Fallback queryset also failed: {fallback_error}")
                # Return empty queryset as last resort
                return Property.objects.none()

    def perform_create(self, serializer):
        # Ensure the seller is set to the current authenticated user
        serializer.save(seller=self.request.user)
        print(f"Property created by user: {self.request.user.username} (ID: {self.request.user.id})")

    def destroy(self, request, *args, **kwargs):
        """Custom destroy method to ensure users can only delete their own properties"""
        try:
            property = self.get_object()
            
            # Check if the current user is the seller of this property
            if property.seller != request.user:
                return Response({
                    'message': 'You do not have permission to delete this property'
                }, status=403)
            
            # Delete the property
            property.delete()
            return Response({
                'message': 'Property deleted successfully'
            }, status=204)
            
        except Exception as e:
            print(f"Error deleting property: {e}")
            return Response({
                'message': 'Error deleting property',
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_properties(self, request):
        """Get properties created by the current user"""
        try:
            properties = Property.objects.filter(seller=request.user).select_related('location', 'seller').prefetch_related('images').order_by('-created_at')
            serializer = PropertySerializer(properties, many=True, context={'request': request})
            return Response({
                'message': 'Your properties retrieved successfully',
                'count': properties.count(),
                'properties': serializer.data
            })
        except Exception as e:
            print(f"Error fetching user properties: {e}")
            return Response({
                'message': 'Error fetching your properties',
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def my_property_detail(self, request, pk=None):
        """Get a specific property created by the current user"""
        try:
            property = Property.objects.filter(seller=request.user, id=pk).select_related('location', 'seller').prefetch_related('images').first()
            if not property:
                return Response({
                    'message': 'Property not found or you do not have permission to view it'
                }, status=404)
            
            serializer = PropertySerializer(property, context={'request': request})
            return Response({
                'message': 'Property retrieved successfully',
                'property': serializer.data
            })
        except Exception as e:
            print(f"Error fetching user property detail: {e}")
            return Response({
                'message': 'Error fetching property details',
                'error': str(e)
            }, status=500)

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

    @action(detail=False, methods=['get'])
    def test(self, request):
        """Test endpoint to debug serialization issues"""
        try:
            # Test basic queryset
            queryset = Property.objects.all()[:5]  # Get first 5 properties
            print(f"Test queryset: {queryset}")
            
            # Test serializer
            serializer = PropertySerializer(queryset, many=True, context={'request': request})
            print(f"Serializer created successfully")
            
            # Test serialization
            data = serializer.data
            print(f"Serialization successful, got {len(data)} properties")
            
            return Response({
                'message': 'Test successful',
                'count': len(data),
                'sample_data': data[0] if data else None
            })
        except Exception as e:
            print(f"Test failed: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'message': f'Test failed: {str(e)}',
                'error': str(e)
            }, status=500)

class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = IndiaLocation.objects.all()
    serializer_class = IndiaLocationSerializer
    
    @action(detail=False, methods=['get'])
    def test(self, request):
        """Test endpoint to verify API is working"""
        return Response({
            'message': 'Location API is working!',
            'sample_data': {
                'states': ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat'],
                'districts': {
                    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
                    'Karnataka': ['Bangalore', 'Mysore', 'Mangalore']
                }
            }
        })
    
    @action(detail=False, methods=['get'])
    def states(self, request):
        try:
            states = IndiaLocation.objects.values_list('state', flat=True).distinct().order_by('state')
            if not states.exists():
                # Return sample states if no data exists
                sample_states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat']
                return Response({'states': sample_states})
            return Response({'states': list(states)})
        except Exception as e:
            # Fallback to sample data
            sample_states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat']
            return Response({'states': sample_states})
    
    @action(detail=False, methods=['get'])
    def districts(self, request):
        try:
            state = request.query_params.get('state')
            if not state:
                return Response({'districts': []}, status=400)
            
            districts = IndiaLocation.objects.filter(state=state) \
                .values_list('district', flat=True).distinct().order_by('district')
            
            if not districts.exists():
                # Return sample districts for the state
                sample_districts = {
                    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
                    'Karnataka': ['Bangalore', 'Mysore', 'Mangalore'],
                    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
                    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi'],
                    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara']
                }
                return Response({'districts': sample_districts.get(state, [])})
            
            return Response({'districts': list(districts)})
        except Exception as e:
            return Response({'districts': []})
    
    @action(detail=False, methods=['get'])
    def sub_districts(self, request):
        try:
            state = request.query_params.get('state')
            district = request.query_params.get('district')
            
            if not state or not district:
                return Response({'sub_districts': []}, status=400)
            
            sub_districts = IndiaLocation.objects.filter(
                state=state, 
                district=district
            ).values_list('sub_district', flat=True).distinct().order_by('sub_district')
            
            if not sub_districts.exists():
                # Return sample sub-districts
                sample_sub_districts = {
                    'Maharashtra': {
                        'Mumbai': ['Mumbai Suburban', 'Mumbai City']
                    },
                    'Karnataka': {
                        'Bangalore': ['Bangalore Urban', 'Bangalore Rural']
                    }
                }
                return Response({'sub_districts': sample_sub_districts.get(state, {}).get(district, [])})
            
            return Response({'sub_districts': list(sub_districts)})
        except Exception as e:
            return Response({'sub_districts': []})
    
    @action(detail=False, methods=['get'])
    def villages(self, request):
        try:
            state = request.query_params.get('state')
            district = request.query_params.get('district')
            sub_district = request.query_params.get('sub_district')
            
            if not all([state, district, sub_district]):
                return Response({'villages': []}, status=400)
            
            villages = IndiaLocation.objects.filter(
                state=state,
                district=district,
                sub_district=sub_district
            ).values_list('village', flat=True).distinct().order_by('village')
            
            if not villages.exists():
                # Return sample villages
                sample_villages = {
                    'Maharashtra': {
                        'Mumbai': {
                            'Mumbai Suburban': ['Andheri', 'Bandra', 'Juhu']
                        }
                    }
                }
                return Response({'villages': sample_villages.get(state, {}).get(district, {}).get(sub_district, [])})
            
            return Response({'villages': list(villages)})
        except Exception as e:
            return Response({'villages': []})
    
    @action(detail=False, methods=['get'])
    def pin_codes(self, request):
        try:
            state = request.query_params.get('state')
            district = request.query_params.get('district')
            sub_district = request.query_params.get('sub_district')
            village = request.query_params.get('village')
            
            query = IndiaLocation.objects.all()
            if state: query = query.filter(state=state)
            if district: query = query.filter(district=district)
            if sub_district: query = query.filter(sub_district=sub_district)
            if village: query = query.filter(village=village)
            
            pin_codes = query.values_list('pin_code', flat=True).distinct().order_by('pin_code')
            
            if not pin_codes.exists():
                # Return sample pin codes
                sample_pin_codes = ['400058', '400050', '400049', '411001', '411045']
                return Response({'pin_codes': sample_pin_codes})
            
            return Response({'pin_codes': list(pin_codes)})
        except Exception as e:
            return Response({'pin_codes': []})

class ShortlistViewSet(viewsets.ModelViewSet):
    serializer_class = ShortlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Shortlist.objects.filter(buyer=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)
