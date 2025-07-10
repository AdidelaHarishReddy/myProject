from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from rest_framework.authtoken.models import Token
from django.contrib.gis.geos import Point
from .models import User, Property, Shortlist, IndiaLocation, PropertyImage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'user_type', 
                 'first_name', 'last_name', 'profile_pic', 'is_verified']

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'phone', 'user_type', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            phone=validated_data['phone'],
            user_type=validated_data['user_type'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)
    token = serializers.CharField(read_only=True)

    def validate(self, data):
        phone = data.get('phone')
        password = data.get('password')

        if phone and password:
            user = authenticate(username=phone, password=password)
            if user:
                if not user.is_verified:
                    raise serializers.ValidationError("Account not verified. Please verify with OTP.")
                
                token, created = Token.objects.get_or_create(user=user)
                update_last_login(None, user)
                
                return {
                    'phone': user.phone,
                    'token': token.key,
                    'user': UserSerializer(user).data
                }
            else:
                raise serializers.ValidationError("Unable to login with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'phone' and 'password'.")

class OTPSerializer(serializers.Serializer):
    phone = serializers.CharField()
    otp = serializers.CharField()

class ResendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField()

class IndiaLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndiaLocation
        fields = ['id', 'state', 'district', 'sub_district', 'village', 'pin_code']

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary']

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    shortlisted_by_count = serializers.SerializerMethodField()
    seller = UserSerializer(read_only=True)
    location = IndiaLocationSerializer(read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    price_per_unit_display = serializers.SerializerMethodField()
    area_display = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = '__all__'
        extra_fields = ['latitude', 'longitude', 'price_per_unit_display', 'area_display']

    def get_latitude(self, obj):
        return obj.geo_location.y if obj.geo_location else None

    def get_longitude(self, obj):
        return obj.geo_location.x if obj.geo_location else None

    def get_shortlisted_by_count(self, obj):
        return obj.shortlisted_by.count()

    def get_price_per_unit_display(self, obj):
        if obj.property_type == 'AGRICULTURE':
            return f"₹{obj.price_per_unit:,.2f}/acre" if obj.price_per_unit else None
        elif obj.property_type == 'OPEN_PLOT':
            return f"₹{obj.price_per_unit:,.2f}/sq yd" if obj.price_per_unit else None
        elif obj.property_type in ['FLAT', 'COMMERCIAL']:
            return f"₹{obj.price_per_unit:,.2f}/sq ft" if obj.price_per_unit else None
        return None

    def get_area_display(self, obj):
        if obj.property_type == 'AGRICULTURE':
            return f"{obj.area:,.2f} acres" if obj.area else None
        elif obj.property_type in ['OPEN_PLOT', 'HOUSE', 'BUILDING']:
            return f"{obj.area:,.2f} sq yds" if obj.area else None
        elif obj.property_type in ['FLAT', 'COMMERCIAL']:
            return f"{obj.area:,.2f} sq ft" if obj.area else None
        return None

    def create(self, validated_data):
        images_data = self.context.get('view').request.FILES
        property = Property.objects.create(**validated_data)
        
        for image_data in images_data.getlist('images'):
            PropertyImage.objects.create(
                property=property,
                image=image_data,
                is_primary=False
            )
        
        if property.images.exists():
            property.images.first().is_primary = True
            property.images.first().save()
        
        return property

class ShortlistSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Shortlist
        fields = ['id', 'property', 'created_at']
