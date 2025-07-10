import uuid
import os
from django.contrib.gis.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db.models import Count
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

def property_image_upload_path(instance, filename):
    return f'properties/{instance.property.id}/images/{uuid.uuid4()}{os.path.splitext(filename)[1]}'

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('SELLER', 'Seller'),
        ('BUYER', 'Buyer'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone = models.CharField(max_length=15, unique=True)
    location = models.PointField(geography=True, null=True, blank=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def generate_otp(self):
        import random
        self.otp = str(random.randint(100000, 999999))
        self.otp_expiry = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        self.save()
        return self.otp

    def verify_otp(self, otp):
        if self.otp == otp and self.otp_expiry > timezone.now():
            self.is_verified = True
            self.otp = None
            self.otp_expiry = None
            self.save()
            return True
        return False

class IndiaLocation(models.Model):
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    sub_district = models.CharField(max_length=100)
    village = models.CharField(max_length=100)
    pin_code = models.CharField(max_length=6)
    centroid = models.PointField(geography=True)
    census_code = models.CharField(max_length=15)

    class Meta:
        unique_together = ('state', 'district', 'sub_district', 'village')

    def __str__(self):
        return f"{self.village}, {self.sub_district}, {self.district}, {self.state}"

class Property(models.Model):
    PROPERTY_TYPES = (
        ('AGRICULTURE', 'Agriculture Land'),
        ('OPEN_PLOT', 'Open Plot'),
        ('FLAT', 'Flat'),
        ('HOUSE', 'Independent House'),
        ('BUILDING', 'Building'),
        ('COMMERCIAL', 'Commercial Space'),
    )
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(max_length=2000)
    address = models.TextField()
    location = models.ForeignKey(IndiaLocation, on_delete=models.PROTECT)
    geo_location = models.PointField(geography=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    area = models.DecimalField(max_digits=10, decimal_places=2)
    youtube_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_property_type_display()})"

    @property
    def price_per_unit(self):
        if self.property_type in ['AGRICULTURE', 'OPEN_PLOT', 'FLAT', 'COMMERCIAL']:
            return self.price / self.area if self.area else 0
        return self.price

    @property
    def shortlisted_by_count(self):
        return self.shortlisted_by.count()

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=property_image_upload_path)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.property.title}"

class Shortlist(models.Model):
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shortlisted')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='shortlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'property')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.buyer.username} shortlisted {self.property.title}"

class PropertyView(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"View of {self.property.title} by {self.user.username if self.user else 'Anonymous'}"
