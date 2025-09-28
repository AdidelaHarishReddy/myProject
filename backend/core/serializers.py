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

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile_pic']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'profile_pic': {'required': False}
        }

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'phone', 'user_type', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate_user_type(self, value):
        """Validate user_type field"""
        valid_types = [choice[0] for choice in User.USER_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid user_type. Must be one of: {valid_types}")
        return value

    def validate_username(self, value):
        """Validate username"""
        if not value:
            raise serializers.ValidationError("Username is required")
        
        # Check if username already exists
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        
        return value

    def validate_phone(self, value):
        """Validate phone number"""
        if not value or len(value) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits")
        
        # Check if phone number already exists
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already exists")
        
        return value

    def create(self, validated_data):
        print(f"Creating user with data: {validated_data}")
        try:
            # Ensure all required fields are present
            required_fields = ['username', 'password', 'phone', 'user_type']
            for field in required_fields:
                if field not in validated_data:
                    raise serializers.ValidationError(f"Missing required field: {field}")
            
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data.get('email', ''),
                phone=validated_data['phone'],
                user_type=validated_data['user_type'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )
            print(f"User created successfully: {user.id}")
            return user
        except Exception as e:
            print(f"Error creating user: {e}")
            raise e

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
        
        # Handle GIS Point creation with better error handling
        centroid_point = None
        geo_location_point = None
        
        try:
            # Try to use GIS Point if available
            from django.contrib.gis.geos import Point
            if latitude and longitude:
                centroid_point = Point(longitude, latitude)
                geo_location_point = Point(longitude, latitude)
            else:
                centroid_point = Point(0, 0)
                geo_location_point = Point(0, 0)
        except (ImportError, Exception) as e:
            print(f"GIS Point creation failed: {e}")
            # Fallback for non-GIS setup - we'll use None and handle it in the model
            centroid_point = None
            geo_location_point = None
        
        # Get or create location
        location, created = IndiaLocation.objects.get_or_create(
            state=state,
            district=district,
            sub_district=sub_district,
            village=village,
            pin_code=pin_code,
            defaults={
                'centroid': centroid_point,
                'census_code': f"{state[:3].upper()}{district[:3].upper()}{sub_district[:3].upper()}{village[:3].upper()}"
            }
        )
        
        # Update centroid if coordinates are provided and location already existed
        if not created and latitude and longitude and centroid_point:
            try:
                location.centroid = centroid_point
                location.save()
            except Exception as e:
                print(f"Failed to update location centroid: {e}")
        
        # Create property
        property = Property.objects.create(
            location=location,
            geo_location=geo_location_point,
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

    def to_representation(self, instance):
        """
        Override to_representation to return complete property data after creation
        """
        print(f"PropertyCreateSerializer.to_representation called for property {instance.id}")
        try:
            # Use PropertySerializer to get the complete representation
            result = PropertySerializer(instance, context=self.context).data
            print(f"PropertySerializer result: {result}")
            return result
        except Exception as e:
            print(f"Error in PropertyCreateSerializer.to_representation: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to basic representation if there's an error
            return {
                'id': instance.id,
                'property_type': instance.property_type,
                'title': instance.title,
                'description': instance.description,
                'address': instance.address,
                'price': str(instance.price),
                'area': str(instance.area),
                'youtube_link': instance.youtube_link,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
                'location': {
                    'id': instance.location.id,
                    'state': instance.location.state,
                    'district': instance.location.district,
                    'sub_district': instance.location.sub_district,
                    'village': instance.location.village,
                    'pin_code': instance.location.pin_code
                } if instance.location else None,
                'images': [],
                'area_display': f"{instance.area} {'acres' if instance.property_type == 'AGRICULTURE' else 'sq yds' if instance.property_type in ['OPEN_PLOT', 'HOUSE', 'BUILDING'] else 'sq ft'}"
            }

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    seller = UserSerializer(read_only=True)
    location = IndiaLocationSerializer(read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    price_per_unit_display = serializers.SerializerMethodField()
    area_display = serializers.SerializerMethodField()
    shortlisted_count = serializers.SerializerMethodField()  # Use different name

    class Meta:
        model = Property
        fields = [
            'id', 'property_type', 'title', 'description', 'address', 
            'location', 'price', 'area', 'youtube_link', 'created_at', 
            'updated_at', 'seller', 'images', 'latitude', 'longitude', 
            'price_per_unit_display', 'area_display', 'shortlisted_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'seller', 'images']

    def get_latitude(self, obj):
        try:
            if hasattr(obj, 'geo_location') and obj.geo_location:
                return obj.geo_location.y
            return None
        except Exception:
            return None

    def get_longitude(self, obj):
        try:
            if hasattr(obj, 'geo_location') and obj.geo_location:
                return obj.geo_location.x
            return None
        except Exception:
            return None

    def get_price_per_unit_display(self, obj):
        try:
            if hasattr(obj, 'price_per_unit') and obj.price_per_unit:
                if obj.property_type == 'AGRICULTURE':
                    return f"₹{obj.price_per_unit:,.2f}/acre"
                elif obj.property_type == 'OPEN_PLOT':
                    return f"₹{obj.price_per_unit:,.2f}/sq yd"
                elif obj.property_type in ['FLAT', 'COMMERCIAL']:
                    return f"₹{obj.price_per_unit:,.2f}/sq ft"
            return None
        except Exception:
            return None

    def get_area_display(self, obj):
        try:
            if hasattr(obj, 'area') and obj.area:
                if obj.property_type == 'AGRICULTURE':
                    return f"{obj.area:,.2f} acres"
                elif obj.property_type in ['OPEN_PLOT', 'HOUSE', 'BUILDING']:
                    return f"{obj.area:,.2f} sq yds"
                elif obj.property_type in ['FLAT', 'COMMERCIAL']:
                    return f"{obj.area:,.2f} sq ft"
            return None
        except Exception:
            return None

    def get_shortlisted_count(self, obj):
        try:
            # Use the model's property method
            return obj.shortlisted_by_count
        except Exception:
            try:
                # Fallback to direct count
                return obj.shortlisted_by.count()
            except Exception:
                return 0

    def to_representation(self, instance):
        """
        Override to_representation to handle any potential conflicts
        """
        try:
            data = super().to_representation(instance)
            return data
        except Exception as e:
            print(f"Error in PropertySerializer.to_representation: {e}")
            import traceback
            traceback.print_exc()
            # Fallback representation
            return {
                'id': getattr(instance, 'id', None),
                'property_type': getattr(instance, 'property_type', 'UNKNOWN'),
                'title': getattr(instance, 'title', 'Untitled'),
                'description': getattr(instance, 'description', ''),
                'address': getattr(instance, 'address', ''),
                'price': str(getattr(instance, 'price', 0)),
                'area': str(getattr(instance, 'area', 0)),
                'youtube_link': getattr(instance, 'youtube_link', None),
                'created_at': getattr(instance, 'created_at', None),
                'updated_at': getattr(instance, 'updated_at', None),
                'location': None,
                'images': [],
                'latitude': None,
                'longitude': None,
                'price_per_unit_display': None,
                'area_display': None,
                'shortlisted_count': 0
            }

class ShortlistSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Shortlist
        fields = ['id', 'property', 'created_at']
