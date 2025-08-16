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

class PropertyCreateSerializer(serializers.ModelSerializer):
    # Location fields for creation
    state = serializers.CharField(write_only=True)
    district = serializers.CharField(write_only=True)
    sub_district = serializers.CharField(write_only=True)
    village = serializers.CharField(write_only=True)
    pin_code = serializers.CharField(write_only=True)
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    
    class Meta:
        model = Property
        fields = [
            'property_type', 'title', 'description', 'address', 
            'state', 'district', 'sub_district', 'village', 'pin_code',
            'latitude', 'longitude', 'price', 'area', 'youtube_link'
        ]

    def create(self, validated_data):
        # Extract location data
        state = validated_data.pop('state')
        district = validated_data.pop('district')
        sub_district = validated_data.pop('sub_district')
        village = validated_data.pop('village')
        pin_code = validated_data.pop('pin_code')
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        
        # Get or create location
        location, created = IndiaLocation.objects.get_or_create(
            state=state,
            district=district,
            sub_district=sub_district,
            village=village,
            pin_code=pin_code,
            defaults={
                'centroid': Point(0, 0) if not latitude or not longitude else Point(longitude, latitude),
                'census_code': f"{state[:3].upper()}{district[:3].upper()}{sub_district[:3].upper()}{village[:3].upper()}"
            }
        )
        
        # Update centroid if coordinates are provided and location already existed
        if not created and latitude and longitude:
            location.centroid = Point(longitude, latitude)
            location.save()
        
        # Create geo_location point
        if latitude and longitude:
            geo_location = Point(longitude, latitude)
        else:
            # Use location centroid if no coordinates provided
            geo_location = location.centroid
        
        # Create property
        property = Property.objects.create(
            location=location,
            geo_location=geo_location,
            **validated_data
        )
        
        # Handle images if any
        images_data = self.context.get('request').FILES
        if images_data:
            for image_data in images_data.getlist('images'):
                PropertyImage.objects.create(
                    property=property,
                    image=image_data,
                    is_primary=False
                )
            
            # Set first image as primary
            if property.images.exists():
                first_image = property.images.first()
                first_image.is_primary = True
                first_image.save()
        
        return property

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
        if obj.price_per_unit:
            if obj.property_type == 'AGRICULTURE':
                return f"₹{obj.price_per_unit:,.2f}/acre"
            elif obj.property_type == 'OPEN_PLOT':
                return f"₹{obj.price_per_unit:,.2f}/sq yd"
            elif obj.property_type in ['FLAT', 'COMMERCIAL']:
                return f"₹{obj.price_per_unit:,.2f}/sq ft"
        return None

    def get_area_display(self, obj):
        if obj.area:
            if obj.property_type == 'AGRICULTURE':
                return f"{obj.area:,.2f} acres"
            elif obj.property_type in ['OPEN_PLOT', 'HOUSE', 'BUILDING']:
                return f"{obj.area:,.2f} sq yds"
            elif obj.property_type in ['FLAT', 'COMMERCIAL']:
                return f"{obj.area:,.2f} sq ft"
        return None

class ShortlistSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Shortlist
        fields = ['id', 'property', 'created_at']
