from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import User, Property, PropertyImage, Shortlist, PropertyView, IndiaLocation

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'phone', 'user_type', 'is_verified')
    search_fields = ('username', 'email', 'phone')

@admin.register(Property)
class PropertyAdmin(OSMGeoAdmin):
    list_display = ('title', 'property_type', 'price', 'seller', 'created_at')
    list_filter = ('property_type', 'created_at')
    search_fields = ('title', 'description', 'address')

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'is_primary')
    list_filter = ('is_primary',)

@admin.register(Shortlist)
class ShortlistAdmin(admin.ModelAdmin):
    list_display = ('buyer', 'property', 'created_at')
    search_fields = ('buyer__username', 'property__title')

@admin.register(PropertyView)
class PropertyViewAdmin(admin.ModelAdmin):
    list_display = ('property', 'user', 'created_at')
    search_fields = ('property__title', 'user__username')

@admin.register(IndiaLocation)
class IndiaLocationAdmin(OSMGeoAdmin):
    list_display = ('state', 'district', 'sub_district', 'village', 'pin_code')
    list_filter = ('state', 'district')
    search_fields = ('state', 'district', 'sub_district', 'village', 'pin_code')
