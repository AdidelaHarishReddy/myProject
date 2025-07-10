import csv
import json
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from core.models import IndiaLocation

class Command(BaseCommand):
    help = 'Load India location hierarchy from Census 2011 and PIN code data'

    def handle(self, *args, **options):
        # This would load from your actual data files
        # Example implementation with sample data
        sample_data = [
            {
                "state": "Maharashtra",
                "district": "Mumbai",
                "sub_district": "Mumbai City",
                "village": "Colaba",
                "pin_code": "400001",
                "longitude": 72.8258,
                "latitude": 18.9220,
                "census_code": "MH001"
            },
            # Add more sample data or load from actual files
        ]

        for item in sample_data:
            IndiaLocation.objects.create(
                state=item['state'],
                district=item['district'],
                sub_district=item['sub_district'],
                village=item['village'],
                pin_code=item['pin_code'],
                centroid=Point(float(item['longitude']), float(item['latitude'])),
                census_code=item['census_code']
            )

        self.stdout.write(self.style.SUCCESS('Successfully loaded location data'))
