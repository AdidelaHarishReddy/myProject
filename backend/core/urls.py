from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, LocationViewSet, UserRegisterView, 
    UserLoginView, VerifyOTPView, ResendOTPView, UserProfileView,
    ShortlistViewSet, TestView, ForgotPasswordView, ResetPasswordView
)

router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'shortlist', ShortlistViewSet, basename='shortlist')

urlpatterns = [
    path('', include(router.urls)),
    path('test/', TestView.as_view(), name='test'),
    path('api/auth/register/', UserRegisterView.as_view(), name='register'),
    path('api/auth/login/', UserLoginView.as_view(), name='login'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/auth/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('api/auth/user/', UserProfileView.as_view(), name='user-profile'),
]
