from django.core.management.base import BaseCommand
from core.models import IndiaLocation

class Command(BaseCommand):
    help = 'Populate sample location data for testing'

    def handle(self, *args, **options):
        # Sample location data for testing
        sample_locations = [
            # Maharashtra
            {'state': 'Maharashtra', 'district': 'Mumbai', 'sub_district': 'Mumbai Suburban', 'village': 'Andheri', 'pin_code': '400058'},
            {'state': 'Maharashtra', 'district': 'Mumbai', 'sub_district': 'Mumbai Suburban', 'village': 'Bandra', 'pin_code': '400050'},
            {'state': 'Maharashtra', 'district': 'Mumbai', 'sub_district': 'Mumbai Suburban', 'village': 'Juhu', 'pin_code': '400049'},
            {'state': 'Maharashtra', 'district': 'Pune', 'sub_district': 'Pune City', 'village': 'Koregaon Park', 'pin_code': '411001'},
            {'state': 'Maharashtra', 'district': 'Pune', 'sub_district': 'Pune City', 'village': 'Baner', 'pin_code': '411045'},
            
            # Karnataka
            {'state': 'Karnataka', 'district': 'Bangalore', 'sub_district': 'Bangalore Urban', 'village': 'Indiranagar', 'pin_code': '560038'},
            {'state': 'Karnataka', 'district': 'Bangalore', 'sub_district': 'Bangalore Urban', 'village': 'Koramangala', 'pin_code': '560034'},
            {'state': 'Karnataka', 'district': 'Mysore', 'sub_district': 'Mysore City', 'village': 'Vijayanagar', 'pin_code': '570017'},
            
            # Tamil Nadu
            {'state': 'Tamil Nadu', 'district': 'Chennai', 'sub_district': 'Chennai City', 'village': 'T Nagar', 'pin_code': '600017'},
            {'state': 'Tamil Nadu', 'district': 'Chennai', 'sub_district': 'Chennai City', 'village': 'Anna Nagar', 'pin_code': '600040'},
            
            # Delhi
            {'state': 'Delhi', 'district': 'New Delhi', 'sub_district': 'New Delhi', 'village': 'Connaught Place', 'pin_code': '110001'},
            {'state': 'Delhi', 'district': 'New Delhi', 'sub_district': 'New Delhi', 'village': 'Lajpat Nagar', 'pin_code': '110024'},
            
            # Gujarat
            {'state': 'Gujarat', 'district': 'Ahmedabad', 'sub_district': 'Ahmedabad City', 'village': 'Navrangpura', 'pin_code': '380009'},
            {'state': 'Gujarat', 'district': 'Surat', 'sub_district': 'Surat City', 'village': 'Adajan', 'pin_code': '395009'},
        ]
        
        created_count = 0
        for location_data in sample_locations:
            location, created = IndiaLocation.objects.get_or_create(
                state=location_data['state'],
                district=location_data['district'],
                sub_district=location_data['sub_district'],
                village=location_data['village'],
                pin_code=location_data['pin_code'],
                defaults={
                    'centroid_lat': 19.0760,  # Default coordinates
                    'centroid_lng': 72.8777,
                    'census_code': f"{location_data['state'][:3].upper()}{location_data['district'][:3].upper()}{location_data['sub_district'][:3].upper()}{location_data['village'][:3].upper()}"
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"Created location: {location}")
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new locations')
        )
