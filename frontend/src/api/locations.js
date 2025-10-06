import axios from 'axios';

// Get API URL with fallback
const getAPIUrl = () => {
  const baseUrl = window._env_?.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  return `${baseUrl}/api/locations/`;
};

const API_URL = getAPIUrl();

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the token //
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token'); // or 'authToken', adjust as per your key
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ---- Client-side fallback dataset loader ----
let indiaCache = null;
const INDIA_DATA_CACHE_KEY = 'india_states_districts_cache_v1';

// Baseline complete list of Indian States (28) and Union Territories (8)
// This guarantees full coverage even if backend/public dataset is unavailable
const BASELINE_STATES = [
  // States (28)
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories (8)
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

async function loadIndiaData() {
  if (indiaCache) return indiaCache;
  try {
    // Try cache first
    const cached = localStorage.getItem(INDIA_DATA_CACHE_KEY);
    if (cached) {
      indiaCache = JSON.parse(cached);
      return indiaCache;
    }
  } catch {}

  // Attempt multiple public sources and MERGE them for completeness
  const sources = [
    // Commonly used GitHub dataset
    'https://raw.githubusercontent.com/bhanuc/indian-list/master/state-and-district.json',
    // Alternative npm CDN dataset
    'https://cdn.jsdelivr.net/npm/india-state-district@1.0.0/india.json',
    // Additional community dataset
    'https://raw.githubusercontent.com/nisrulz/india_cities/master/states_and_districts.json'
  ];

  const aggregate = { states: [...BASELINE_STATES], districtsByState: {} };
  BASELINE_STATES.forEach(s => { aggregate.districtsByState[s] = aggregate.districtsByState[s] || []; });

  for (const url of sources) {
    try {
      const resp = await fetch(url, { cache: 'no-cache', mode: 'cors' });
      if (!resp.ok) continue;
      const data = await resp.json();
      const normalized = normalizeIndiaData(data);
      if (normalized && Array.isArray(normalized.states) && normalized.states.length) {
        // Merge states
        normalized.states.forEach(s => {
          if (s) aggregate.states.push(s);
        });
        // Merge districts
        Object.keys(normalized.districtsByState || {}).forEach(state => {
          aggregate.districtsByState[state] = Array.from(new Set([...
            (aggregate.districtsByState[state] || []),
            ...(normalized.districtsByState[state] || [])
          ]));
        });
      }
    } catch {}
  }

  // Deduplicate and sort
  aggregate.states = Array.from(new Set(aggregate.states)).sort((a,b) => a.localeCompare(b));
  aggregate.states.forEach(s => {
    const d = Array.from(new Set(aggregate.districtsByState[s] || []));
    aggregate.districtsByState[s] = d.sort((a,b) => a.localeCompare(b));
  });

  // Cache result if meaningful
  if (aggregate.states.length) {
    indiaCache = aggregate;
    try { localStorage.setItem(INDIA_DATA_CACHE_KEY, JSON.stringify(indiaCache)); } catch {}
    return indiaCache;
  }
  return null;
}

function normalizeIndiaData(raw) {
  // Normalize different shapes into { states: string[], districtsByState: Record<string, string[]> }
  const result = { states: [], districtsByState: {} };

  if (Array.isArray(raw) && raw[0] && raw[0].state && raw[0].districts) {
    // Shape: [{ state: 'Maharashtra', districts: ['Mumbai', ...] }, ...]
    raw.forEach(entry => {
      if (!entry?.state) return;
      result.states.push(entry.state);
      result.districtsByState[entry.state] = Array.isArray(entry.districts) ? entry.districts : [];
    });
  } else if (raw && raw.states && raw.districts) {
    // Shape: { states: ['Maharashtra', ...], districts: { 'Maharashtra': ['Mumbai', ...] } }
    result.states = raw.states;
    result.districtsByState = raw.districts;
  } else if (raw && typeof raw === 'object') {
    // Shape: { 'Maharashtra': ['Mumbai', ...], ... }
    const states = Object.keys(raw);
    result.states = states;
    states.forEach(s => { result.districtsByState[s] = Array.isArray(raw[s]) ? raw[s] : []; });
  }

  // Deduplicate and sort
  result.states = Array.from(new Set(result.states)).sort((a,b) => a.localeCompare(b));
  Object.keys(result.districtsByState).forEach(s => {
    const d = Array.from(new Set(result.districtsByState[s] || []));
    result.districtsByState[s] = d.sort((a,b) => a.localeCompare(b));
  });

  return result;
}

const getStates = async () => {
  try {
    const response = await api.get('states/');
    const list = response?.data?.states || [];

    // Load public dataset for completeness
    const india = await loadIndiaData();

    if (india) {
      // Merge backend list with full dataset; prefer full set if backend partial
      const merged = Array.from(new Set([
        ...BASELINE_STATES,
        ...(india.states || []),
        ...list
      ])).sort((a,b) => a.localeCompare(b));
      return { states: merged };
    }

    if (list.length) {
      const merged = Array.from(new Set([...BASELINE_STATES, ...list])).sort((a,b) => a.localeCompare(b));
      return { states: merged };
    }

    // Final fallback: full baseline list
    return { states: BASELINE_STATES };
  } catch (error) {
    console.error('Error fetching states:', error);
    // Fallback to public dataset
    const india = await loadIndiaData();
    if (india) {
      const merged = Array.from(new Set([...BASELINE_STATES, ...(india.states || [])])).sort((a,b) => a.localeCompare(b));
      return { states: merged };
    }
    // Final fallback: full baseline list
    return { states: BASELINE_STATES };
  }
};

const getDistricts = async (state) => {
  try {
    const response = await api.get(`districts/?state=${encodeURIComponent(state)}`);
    const list = response?.data?.districts || [];

    // Load public dataset for completeness
    const india = await loadIndiaData();

    if (india?.districtsByState?.[state]) {
      const full = india.districtsByState[state] || [];
      const merged = Array.from(new Set([...(full || []), ...list])).sort((a,b) => a.localeCompare(b));
      // Ensure Andaman and Nicobar Islands has the three official districts
      if (state === 'Andaman and Nicobar Islands') {
        const andaman = ['North and Middle Andaman', 'South Andaman', 'Nicobar'];
        return { districts: Array.from(new Set([...merged, ...andaman])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Andhra Pradesh (26 districts)
      if (state === 'Andhra Pradesh') {
        const ap = [
          'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor',
          'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Krishna',
          'Kurnool', 'Nandyal', 'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Srikakulam',
          'Sri Sathya Sai', 'SPSA Nellore', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'YSR (Kadapa)',
          'West Godavari'
        ];
        return { districts: Array.from(new Set([...merged, ...ap])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Arunachal Pradesh (override list from user)
      if (state === 'Arunachal Pradesh') {
        const arp = [
          'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Kamle',
          'Keyi Panyor', 'Kurung Kumey', 'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang',
          'Lower Subansiri', 'Namsai', 'Pakke-Kessang', 'Papum Pare', 'Siang', 'Tawang', 'Tirap',
          'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang', 'Lakhimpur', 'Bichom'
        ];
        return { districts: Array.from(new Set([...merged, ...arp])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Assam (35 districts)
      if (state === 'Assam') {
        const asm = [
          'Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji',
          'Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup',
          'Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon',
          'Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tamulpur','Tinsukia',
          'Udalguri','West Karbi Anglong'
        ];
        return { districts: Array.from(new Set([...merged, ...asm])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Chandigarh (3 subdivisions)
      if (state === 'Chandigarh') {
        const chd = ['Central', 'East', 'West'];
        return { districts: Array.from(new Set([...merged, ...chd])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Bihar (38 districts)
      if (state === 'Bihar') {
        const bhr = [
          'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga',
          'East Champaran (Purba Champaran)','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar',
          'Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda',
          'Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar',
          'Sitamarhi','Siwan','Supaul','Vaishali','West Champaran (Pashchim Champaran)'
        ];
        return { districts: Array.from(new Set([...merged, ...bhr])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Chhattisgarh (33 districts)
      if (state === 'Chhattisgarh') {
        const cgh = [
          'Balod','Baloda Bazar','Balrampur-Ramanujganj','Bastar','Bemetara','Bijapur','Bilaspur',
          'Dantewada (Dakshin Bastar)','Dhamtari','Durg','Gariaband','Gaurela-Pendra-Marwahi',
          'Janjgir-Champa','Jashpur','Kabirdham (Kawardha)','Kanker (Uttar Bastar)',
          'Khairagarh-Chhuikhadan-Gandai','Kondagaon','Korba','Koriya','Mahasamund',
          'Manendragarh-Chirmiri-Bharatpur','Mohla-Manpur-Ambagarh Chowki','Mungeli','Narayanpur',
          'Raigarh','Raipur','Rajnandgaon','Sarangarh-Bilaigarh','Sukma','Surajpur','Surguja','Sakti'
        ];
        return { districts: Array.from(new Set([...merged, ...cgh])).sort((a,b) => a.localeCompare(b)) };
      }
      // Ensure Dadra and Nagar Haveli and Daman and Diu (3 districts)
      if (state === 'Dadra and Nagar Haveli and Daman and Diu') {
        const dnhdd = ['Dadra and Nagar Haveli District', 'Daman District', 'Diu District'];
        return { districts: Array.from(new Set([...merged, ...dnhdd])).sort((a,b) => a.localeCompare(b)) };
      }
      return { districts: merged };
    }

    if (list.length) {
      // Ensure Andaman districts when backend provides partial list
      if (state === 'Andaman and Nicobar Islands') {
        const andaman = ['North and Middle Andaman', 'South Andaman', 'Nicobar'];
        const merged = Array.from(new Set([...(list || []), ...andaman])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Andhra Pradesh') {
        const ap = [
          'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor',
          'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Krishna',
          'Kurnool', 'Nandyal', 'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Srikakulam',
          'Sri Sathya Sai', 'SPSA Nellore', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'YSR (Kadapa)',
          'West Godavari'
        ];
        const merged = Array.from(new Set([...(list || []), ...ap])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Arunachal Pradesh') {
        const arp = [
          'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Kamle',
          'Keyi Panyor', 'Kurung Kumey', 'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang',
          'Lower Subansiri', 'Namsai', 'Pakke-Kessang', 'Papum Pare', 'Siang', 'Tawang', 'Tirap',
          'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang', 'Lakhimpur', 'Bichom'
        ];
        const merged = Array.from(new Set([...(list || []), ...arp])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Chandigarh') {
        const chd = ['Central', 'East', 'West'];
        const merged = Array.from(new Set([...(list || []), ...chd])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Assam') {
        const asm = [
          'Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji',
          'Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup',
          'Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon',
          'Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tamulpur','Tinsukia',
          'Udalguri','West Karbi Anglong'
        ];
        const merged = Array.from(new Set([...(list || []), ...asm])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Bihar') {
        const bhr = [
          'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga',
          'East Champaran (Purba Champaran)','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar',
          'Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda',
          'Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar',
          'Sitamarhi','Siwan','Supaul','Vaishali','West Champaran (Pashchim Champaran)'
        ];
        const merged = Array.from(new Set([...(list || []), ...bhr])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Chhattisgarh') {
        const cgh = [
          'Balod','Baloda Bazar','Balrampur-Ramanujganj','Bastar','Bemetara','Bijapur','Bilaspur',
          'Dantewada (Dakshin Bastar)','Dhamtari','Durg','Gariaband','Gaurela-Pendra-Marwahi',
          'Janjgir-Champa','Jashpur','Kabirdham (Kawardha)','Kanker (Uttar Bastar)',
          'Khairagarh-Chhuikhadan-Gandai','Kondagaon','Korba','Koriya','Mahasamund',
          'Manendragarh-Chirmiri-Bharatpur','Mohla-Manpur-Ambagarh Chowki','Mungeli','Narayanpur',
          'Raigarh','Raipur','Rajnandgaon','Sarangarh-Bilaigarh','Sukma','Surajpur','Surguja','Sakti'
        ];
        const merged = Array.from(new Set([...(list || []), ...cgh])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      if (state === 'Dadra and Nagar Haveli and Daman and Diu') {
        const dnhdd = ['Dadra and Nagar Haveli District', 'Daman District', 'Diu District'];
        const merged = Array.from(new Set([...(list || []), ...dnhdd])).sort((a,b) => a.localeCompare(b));
        return { districts: merged };
      }
      return { districts: list.sort((a,b) => a.localeCompare(b)) };
    }

    // Final fallback
    if (state === 'Andaman and Nicobar Islands') {
      return { districts: ['North and Middle Andaman', 'South Andaman', 'Nicobar'] };
    }
    return { districts: [] };
  } catch (error) {
    console.error('Error fetching districts:', error);
    // Fallback to public dataset
    const india = await loadIndiaData();
    if (india?.districtsByState?.[state]) {
      const fallback = india.districtsByState[state];
      if (state === 'Andaman and Nicobar Islands') {
        const andaman = ['North and Middle Andaman', 'South Andaman', 'Nicobar'];
        return { districts: Array.from(new Set([...(fallback || []), ...andaman])).sort((a,b) => a.localeCompare(b)) };
      }
        if (state === 'Chandigarh') {
          const chd = ['Central', 'East', 'West'];
          return { districts: Array.from(new Set([...(fallback || []), ...chd])).sort((a,b) => a.localeCompare(b)) };
        }
      if (state === 'Andhra Pradesh') {
        const ap = [
          'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor',
          'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Krishna',
          'Kurnool', 'Nandyal', 'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Srikakulam',
          'Sri Sathya Sai', 'SPSA Nellore', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'YSR (Kadapa)',
          'West Godavari'
        ];
        return { districts: Array.from(new Set([...(fallback || []), ...ap])).sort((a,b) => a.localeCompare(b)) };
      }
      if (state === 'Arunachal Pradesh') {
        const arp = [
          'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Kamle',
          'Keyi Panyor', 'Kurung Kumey', 'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang',
          'Lower Subansiri', 'Namsai', 'Pakke-Kessang', 'Papum Pare', 'Siang', 'Tawang', 'Tirap',
          'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang', 'Lakhimpur', 'Bichom'
        ];
        return { districts: Array.from(new Set([...(fallback || []), ...arp])).sort((a,b) => a.localeCompare(b)) };
      }
      if (state === 'Assam') {
        const asm = [
          'Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji',
          'Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup',
          'Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon',
          'Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tamulpur','Tinsukia',
          'Udalguri','West Karbi Anglong'
        ];
        return { districts: Array.from(new Set([...(fallback || []), ...asm])).sort((a,b) => a.localeCompare(b)) };
      }
      if (state === 'Bihar') {
        const bhr = [
          'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga',
          'East Champaran (Purba Champaran)','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar',
          'Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda',
          'Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar',
          'Sitamarhi','Siwan','Supaul','Vaishali','West Champaran (Pashchim Champaran)'
        ];
        return { districts: Array.from(new Set([...(fallback || []), ...bhr])).sort((a,b) => a.localeCompare(b)) };
      }
      if (state === 'Chhattisgarh') {
        const cgh = [
          'Balod','Baloda Bazar','Balrampur-Ramanujganj','Bastar','Bemetara','Bijapur','Bilaspur',
          'Dantewada (Dakshin Bastar)','Dhamtari','Durg','Gariaband','Gaurela-Pendra-Marwahi',
          'Janjgir-Champa','Jashpur','Kabirdham (Kawardha)','Kanker (Uttar Bastar)',
          'Khairagarh-Chhuikhadan-Gandai','Kondagaon','Korba','Koriya','Mahasamund',
          'Manendragh-Chirmiri-Bharatpur','Mohla-Manpur-Ambagarh Chowki','Mungeli','Narayanpur',
          'Raigarh','Raipur','Rajnandgaon','Sarangarh-Bilaigarh','Sukma','Surajpur','Surguja','Sakti'
        ];
        return { districts: Array.from(new Set([...(fallback || []), ...cgh])).sort((a,b) => a.localeCompare(b)) };
      }
      if (state === 'Dadra and Nagar Haveli and Daman and Diu') {
        const dnhdd = ['Dadra and Nagar Haveli District', 'Daman District', 'Diu District'];
        return { districts: Array.from(new Set([...(fallback || []), ...dnhdd])).sort((a,b) => a.localeCompare(b)) };
      }
      return { districts: fallback };
    }
    // Minimal fallback
    const fallbackDistricts = {
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
      'Karnataka': ['Bangalore', 'Mysore', 'Mangalore'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
      'Delhi': ['New Delhi', 'North Delhi', 'South Delhi'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
      'Andaman and Nicobar Islands': ['North and Middle Andaman', 'South Andaman', 'Nicobar'],
      'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli District', 'Daman District', 'Diu District']
    };
    return { districts: fallbackDistricts[state] || [] };
  }
};

const getSubDistricts = async (state, district) => {
  try {
    const response = await api.get(`sub_districts/?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
    console.log('Sub-districts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching sub-districts:', error);
    // Return fallback data
    const fallbackSubDistricts = {
      'Maharashtra': {
        'Mumbai': ['Mumbai Suburban', 'Mumbai City'],
        'Pune': ['Pune City', 'Pune Rural']
      },
      'Karnataka': {
        'Bangalore': ['Bangalore Urban', 'Bangalore Rural']
      }
    };
    return { sub_districts: fallbackSubDistricts[state]?.[district] || [] };
  }
};

const getVillages = async (state, district, subDistrict) => {
  try {
    const response = await api.get(`villages/?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&sub_district=${encodeURIComponent(subDistrict)}`);
    console.log('Villages response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching villages:', error);
    // Return fallback data
    const fallbackVillages = {
      'Maharashtra': {
        'Mumbai': {
          'Mumbai Suburban': ['Andheri', 'Bandra', 'Juhu']
        }
      }
    };
    return { villages: fallbackVillages[state]?.[district]?.[subDistrict] || [] };
  }
};

const getPinCodes = async (state, district, subDistrict, village) => {
  try {
    let url = `pin_codes/?`;
    if (state) url += `state=${encodeURIComponent(state)}&`;
    if (district) url += `district=${encodeURIComponent(district)}&`;
    if (subDistrict) url += `sub_district=${encodeURIComponent(subDistrict)}&`;
    if (village) url += `village=${encodeURIComponent(village)}`;
    
    const response = await api.get(url);
    console.log('Pin codes response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching pin codes:', error);
    // Return fallback data
    return { pin_codes: ['400058', '400050', '400049', '411001', '411045'] };
  }
};

export default {
  getStates,
  getDistricts,
  getSubDistricts,
  getVillages,
  getPinCodes
};
