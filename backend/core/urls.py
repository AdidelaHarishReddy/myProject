from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, LocationViewSet, UserRegisterView, 
    UserLoginView, VerifyOTPView, ResendOTPView, UserProfileView,
    ShortlistViewSet
)

router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'shortlist', ShortlistViewSet, basename='shortlist')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', UserRegisterView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('auth/user/', UserProfileView.as_view(), name='user-profile'),
]
