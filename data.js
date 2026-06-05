/**
 * AutoScribe — Indian fake data provider
 * Swap this file with an AI-powered provider in the future without touching content.js
 */
window.AUTOSCRIBE_DATA = (() => {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const rn   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const digs = n => Array.from({ length: n }, () => rn(0, 9)).join('');

  // ── Names (200+ each) ─────────────────────────────────────────────────────
  const FIRST = [
    'Aarav','Arjun','Vihaan','Reyan','Aditya','Dhruv','Rohan','Ishaan','Parth','Yash',
    'Hardik','Vatsal','Raj','Kiran','Amit','Vijay','Sanjay','Deepak','Rahul','Kushal',
    'Nikhil','Ritesh','Sachin','Suresh','Mahesh','Rakesh','Ramesh','Dinesh','Ganesh','Naresh',
    'Vivek','Manish','Rajesh','Praveen','Sunil','Anil','Pankaj','Ajay','Manoj','Vikas',
    'Akash','Ankit','Ankur','Ashish','Gaurav','Lalit','Lokesh','Mohit','Neeraj','Nitin',
    'Aryan','Mohan','Sohan','Roshan','Kishan','Chetan',
    'Bhavesh','Jignesh','Hiren','Nilesh','Chirag','Vishal','Viral','Krunal','Kuntal','Dhaval',
    'Bhavin','Alpesh','Dipesh','Jigar','Kapil','Kamal','Keshav','Kartik','Kunal','Kabir',
    'Kaushik','Kalpesh','Bharat','Bhavik','Bhushan','Prabhat','Prashant','Prasad','Prakash','Pramod',
    'Pradeep','Pravin','Pravesh','Prem','Paresh',
    'Abhishek','Abhinav','Akhil','Amol','Anirudh','Arnav','Atharv','Avnish','Brijesh','Chandresh',
    'Darshan','Devendra','Deven','Dharmesh','Dilip','Dipak','Eshan','Falgun','Girish','Gopal',
    'Govind','Hari','Harsh','Hemant','Himanshu','Hitesh','Jagdish','Jayesh','Jitendra',
    'Ketan','Kuldeep','Lakhan','Laxman','Madhav','Manan','Mayank','Mihir','Mitesh','Mukesh',
    'Naman','Narendra','Naveen','Nayan','Omkar','Pankil','Paras','Parimal','Piyush','Pranav',
    'Pratik','Pushkar','Raghav','Rajan','Ranjit','Ravi','Rishabh','Rohit','Rupesh','Sagar',
    'Sahil','Samir','Sandeep','Saurabh','Shashank','Shivam','Shrey','Siddharth','Sumit','Tarun',
    'Tushar','Udayan','Umesh','Utkarsh','Vaibhav','Vinay','Vinod','Yatin','Yogesh','Zubin',
    'Priya','Sneha','Pooja','Kavya','Ananya','Neha','Meera','Divya','Shruti','Nisha',
    'Preeti','Ritu','Sunita','Sushma','Asha','Lata','Usha','Rekha','Madhu','Kavitha',
    'Lakshmi','Radha','Geeta','Sita','Parvati','Durga','Saraswati','Uma','Malti','Vimla',
    'Riya','Tanvi','Tanya','Trisha',
    'Naina','Pari','Khushi','Simran','Riddhi','Siddhi','Bhoomi','Foram','Monal','Pinal',
    'Ami','Hetal','Komal','Shreya','Kriti','Kritika','Aditi','Ahana','Ishika','Rashi',
    'Palak','Sakshi','Swati','Harsha','Deepika','Sonam','Shilpa','Shweta','Aarti','Bharti',
    'Kirti','Mamta','Jyoti','Jhanvi','Janvi','Nidhi','Ridhi','Vidhi','Vrinda','Vrishti',
    'Vanshi','Vani','Bhavna','Tejal',
    'Aanchal','Amrita','Ankita','Archana','Avni','Bhumi','Charmi','Chetna','Disha','Ekta',
    'Gargi','Gauri','Heena','Himani','Ira','Ishita','Jasmine','Juhi','Kajal','Kalpana',
    'Kinjal','Krisha','Lavanya','Madhuri','Manali','Manisha','Mitali','Mrunali','Nandini','Nikita',
    'Nimisha','Padma','Payal','Poonam','Rachna','Ragini','Rani','Renu','Richa','Roshni',
    'Rupal','Sadhana','Sanjana','Sapna','Sejal','Shivani','Smita','Sonali','Suhani','Tanisha',
    'Urvi','Vaishali','Vandana','Varsha','Yamini','Yukta',
  ];

  const LAST = [
    'Sharma','Patel','Shah','Mehta','Joshi','Desai','Gupta','Singh','Kumar','Verma',
    'Bhalodiya','Makwana','Solanki','Rathod','Chauhan','Jadeja','Parmar','Thakkar','Soni','Rajput',
    'Bhatt','Trivedi','Pandya','Dave','Sheth','Vora','Bhavsar','Raval','Nayak','Khatri',
    'Mistry','Modi','Nanavati','Shroff','Dalal','Doshi','Gajjar','Inamdar','Jhaveri','Zaveri',
    'Agarwal','Bansal','Mittal','Goel','Khanna','Malhotra','Kapoor','Bhatia','Chopra','Anand',
    'Tiwari','Mishra','Pandey','Shukla','Yadav','Chaudhary','Maurya','Pal','Saha','Das',
    'Chandra','Dubey','Garg','Handa','Irani','Jain','Kaul','Lamba','Nagpal','Oberoi',
    'Prasad','Saxena','Tandon','Upadhyay','Vaswani','Kohli','Mehra','Narang','Suri',
    'Nair','Pillai','Menon','Iyer','Iyengar','Reddy','Naidu','Rao','Chari','Rajan',
    'Subramaniam','Krishnamurthy','Swaminathan','Venkatesan','Narayanan','Balakrishnan','Sundaram','Ramachandran',
    'Kulkarni','Lele','Mane','Naik','Parekh','Pathak','Ranade','Sathe','Shinde','Bhosale',
    'Mukherjee','Chatterjee','Banerjee','Ghosh','Sen','Roy','Bose','Dutta','Mitra','Chakraborty',
    'Acharya','Bedi','Chadha','Deol','Goenka','Jolly','Raghunathan','Venkat','Thakur','Lal',
    'Wagh','Bajaj','Barot','Behl','Bhandari','Bhardwaj','Bhutra','Bisht','Bohra','Chahar',
    'Dahiya','Dhawan','Dixit','Dua','Dutt','Gambhir','Goswami','Grover','Gulati','Hora',
    'Jaggi','Jassal','Johar','Juneja','Kakkar','Kalra','Kamboj','Kashyap','Katyal','Khurana',
    'Kochhar','Luthra','Mahajan','Mangal','Mathur','Narula','Pandit','Pahuja','Randhawa','Rastogi',
    'Saini','Saluja','Sethi','Sodhani','Talwar','Thapar','Trehan','Tuteja','Wadhwa','Wig',
    'Arora','Bakshi','Chawla','Dhingra','Gujral','Hanspal','Khattar','Madan','Rawat','Vohra',
  ];

  // ── Cities (100+) ─────────────────────────────────────────────────────────
  const CITIES = [
    'Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar','Bhavnagar','Jamnagar','Anand','Nadiad','Mehsana',
    'Mumbai','Pune','Nagpur','Nashik','Thane','Aurangabad','Solapur','Kolhapur','Amravati','Nanded',
    'Delhi','Noida','Gurgaon','Faridabad','Ghaziabad','Meerut','Agra','Lucknow','Kanpur','Varanasi',
    'Bengaluru','Mysuru','Mangaluru','Hubballi','Belagavi','Davangere','Ballari','Tumkur','Shivamogga','Udupi',
    'Hyderabad','Warangal','Nizamabad','Karimnagar','Vijayawada','Visakhapatnam','Tirupati','Guntur','Nellore','Kurnool',
    'Chennai','Coimbatore','Madurai','Trichy','Salem','Tirunelveli','Erode','Vellore','Thoothukudi','Tiruppur',
    'Kolkata','Howrah','Durgapur','Asansol','Siliguri','Kharagpur','Burdwan','Malda','Midnapore','Haldia',
    'Jaipur','Jodhpur','Kota','Bikaner','Udaipur','Ajmer','Bhilwara','Alwar','Bharatpur','Sikar',
    'Bhopal','Indore','Gwalior','Jabalpur','Ujjain','Rewa','Satna','Sagar','Dewas','Ratlam',
    'Chandigarh','Amritsar','Ludhiana','Jalandhar','Patiala','Bathinda','Mohali','Pathankot','Hoshiarpur','Firozpur',
  ];

  const STATES = [
    'Gujarat','Maharashtra','Delhi','Karnataka','Telangana','Andhra Pradesh',
    'Tamil Nadu','West Bengal','Rajasthan','Madhya Pradesh','Punjab','Uttar Pradesh',
    'Kerala','Odisha','Haryana','Bihar','Assam','Jharkhand','Uttarakhand','Himachal Pradesh',
  ];

  const NATIONALITY = 'Indian';

  // ── Streets (55+) ─────────────────────────────────────────────────────────
  const STREETS = [
    'MG Road','Station Road','Gandhi Nagar','Nehru Chowk','Ashram Road','Ring Road','Relief Road',
    'Navrangpura','Satellite Road','CG Road','Kalanala','SG Highway','Civil Lines','Mall Road',
    'Brigade Road','Residency Road','Anna Salai','Nungambakkam High Road','T Nagar Main Road',
    'Park Street','Camac Street','AJC Bose Road','Chittaranjan Avenue','Linking Road','SV Road',
    'LBS Marg','Eastern Express Highway','Marine Drive','Connaught Place','Janpath','Lodhi Road',
    'Banjara Hills Road','Jubilee Hills Road','Hitech City Road','FC Road','JM Road','Baner Road',
    'Koregaon Park Road','Tilak Road','Law College Road','Karve Road','Senapati Bapat Road',
    // Additional streets to reach 55+
    'Lal Darwaja Road','Manekchowk Road','Manek Baug Road','Paldi Road','Ambawadi Road',
    'Vastrapur Lake Road','Bopal Road','Science City Road','Sarkhej Road','Naroda Road',
    'SP Ring Road','Drive In Road','Thaltej Road','Prahlad Nagar Road','Gurukul Road',
    'Shyamal Cross Road','Bodakdev Road','Jodhpur Cross Road','Maninagar Road','Gomtipur Road',
    'Chandni Chowk','Rajendra Nagar Road','Hazratganj Road','Aminabad Road','Karol Bagh Road',
    'Laxmi Nagar Road','Dwarka Sector Road','Rohini Sector Road','Pitampura Road','Model Town Road',
  ];

  // ── Areas (35+) ───────────────────────────────────────────────────────────
  const AREAS = [
    'Near Railway Station','Opposite Bus Stand','Main Chowk','Sector 12','Block B',
    'Near City Mall','Behind Post Office','Opposite School','Near Hospital','Main Market Area',
    'Industrial Area','Residential Colony','Phase 1','Phase 2','Phase 3',
    'Extension Area','Civil Lines Area','Heritage Area','Commercial Zone','IT Park Area',
    // Additional areas to reach 35+
    'Near Town Hall','Opposite Temple','Behind Municipal Office','Near University Gate','Old City Area',
    'New Town Extension','Lake View Colony','Green Park Society','Shanti Nagar','Jawahar Nagar',
    'Sadar Bazaar Area','Model Town','Subhash Nagar','Vikas Puri','Gandhi Colony',
    'Panchsheel Enclave','Defence Colony','Lajpat Nagar','Greater Kailash','Vasant Vihar',
  ];

  const BANKS = [
    'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank',
    'Bank of Baroda','Punjab National Bank','Canara Bank','Union Bank of India',
    'IndusInd Bank','Yes Bank','IDFC First Bank','Federal Bank','South Indian Bank','Karnataka Bank',
    'Bank of India','Central Bank of India','Indian Bank','UCO Bank','Indian Overseas Bank',
    'Punjab & Sind Bank','State Bank of Patiala','State Bank of Mysore','State Bank of Travancore',
    'State Bank of Hyderabad','State Bank of Bikaner & Jaipur','IDBI Bank','RBL Bank','Bandhan Bank',
    'Karur Vysya Bank','City Union Bank','Tamilnad Mercantile Bank','Nainital Bank','Catholic Syrian Bank',
    'Dhanlaxmi Bank','Jammu & Kashmir Bank','Saraswat Cooperative Bank','Cosmos Cooperative Bank',
    'SVC Cooperative Bank','Kalupur Commercial Cooperative Bank','Mehsana Urban Cooperative Bank',
    'Ahmedabad District Cooperative Bank','Rajkot District Cooperative Bank','Surat District Cooperative Bank',
    'Baroda Gujarat Gramin Bank','Saurashtra Gramin Bank','Prathama UP Gramin Bank','Aryavart Bank',
    'Madhyanchal Gramin Bank','Baroda Rajasthan Kshetriya Gramin Bank','Rajasthan Marudhara Gramin Bank',
    'Maharashtra Gramin Bank','Vidharbha Konkan Gramin Bank','Karnataka Vikas Grameena Bank',
    'Andhra Pragathi Grameena Bank','Telangana Grameena Bank','Kerala Gramin Bank',
    'Paschim Banga Gramin Bank','Uttarbanga Kshetriya Gramin Bank','Assam Gramin Vikash Bank'
  ];

  const IFSC_CODES = ['SBIN','HDFC','ICIC','UTIB','KKBK','BARB','PUNB','CNRB','UBIN','INDB','YESB','IDFB','FDRL','SIBL','KARB','BKID','CBIN','IDIB','UCBA','IOBA','PSIB','IBKL','RATN','BDHN','KVBL','CIUB','TMBL','NESF','CSBK','DLXB','JAKA','SRCB','COSB','SVCB','KCCB','MUCO','ADCB','RDCB','SDCB'];

  const DESIGNATIONS = [
    'Software Engineer','Senior Developer','Team Lead','Project Manager','HR Executive',
    'Sales Manager','Accountant','Operations Manager','Business Analyst','UI/UX Designer',
    'DevOps Engineer','QA Engineer','Data Analyst','Product Manager','Marketing Executive',
    'Technical Architect','Solution Architect','Engineering Manager','Director of Engineering',
    'VP of Engineering','Chief Technology Officer','Chief Executive Officer','Chief Operating Officer',
    'Chief Financial Officer','Product Designer','UX Researcher','Content Writer','Copywriter',
    'SEO Specialist','Social Media Manager','Digital Marketing Specialist','PR Manager',
    'Customer Success Manager','Customer Support Executive','Technical Support Engineer',
    'System Administrator','Network Engineer','Database Administrator','Security Engineer',
    'Data Scientist','Machine Learning Engineer','AI Researcher','BI Analyst',
    'Financial Analyst','Tax Consultant','Auditor','Accounts Executive','Billing Specialist',
    'HR Manager','Recruitment Specialist','Talent Acquisition Lead','Office Administrator',
    'Receptionist','Facilities Manager','Legal Counsel','Compliance Officer',
    'Procurement Manager','Supply Chain Analyst','Logistics Coordinator','Store Manager'
  ];

  const DEPARTMENTS = [
    'Engineering','Human Resources','Sales','Finance','Operations',
    'Marketing','Administration','Legal','IT Support','Customer Service',
    'Research & Development','Quality Assurance','Product Management','Data Science',
    'Business Intelligence','Information Security','Facilities','Procurement',
    'Supply Chain','Logistics','Design','Content & Creative','Billing & Accounts',
    'Public Relations','Corporate Communications'
  ];

  const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

  // ── Email domains — Indian-specific + international ───────────────────────
  const EMAIL_DOMAINS = [
    'gmail.com','yahoo.in','rediffmail.com','outlook.in','yahoo.com','hotmail.com',
    'protonmail.com','zoho.in','mail.com','aol.com','icloud.com','yandex.com',
    'sify.com','indiatimes.com','live.in','msn.com',
  ];

  const PINS = ['380001','380006','395001','390001','360001','361001','400001','411001','110001','560001','600001','700001','302001','500001','600017','411005','380015','395003','390007','382007'];

  // Programmatic large-scale datasets expansion generators (adds thousands of valid values on load)
  (() => {
    // Generate Male and female first names
    const prefixes = ['Ad','Abh','Amit','An','Arav','Arj','Ash','Bhav','Char','Deep','Dev','Dhir','Gaur','Har','Hem','Ish','Jay','Kap','Ketan','Man','Moh','Nav','Nikh','Nil','Pank','Prat','Raghav','Raj','Rish','Rohan','Sach','Sam','Sandeep','Saur','Shiv','Siddh','Sum','Tar','Tush','Uday','Vaibh','Vik','Vin','Yash','Yog'];
    const suffixes = ['av','ay','an','en','esh','ik','ish','it','ok','al','ur','endra','anshu','as','arth','il','un','ant','ab','am','ivek','ishal','ikas','itendra'];
    const femalePrefixes = ['Ad','An','Av','Bhav','Chet','Deep','Div','Ek','Gaur','Har','Hem','Ish','Jal','Jyot','Kaj','Kalp','Kav','Kirti','Kom','Krit','Lal','Madh','Man','Mit','Mon','Nain','Nand','Neh','Nid','Nish','Poo','Priy','Rach','Radh','Rag','Rekh','Rich','Ridh','Riy','Rup','Sanj','Sap','Sej','Shiv','Shr','Siddh','Sneh','Suh','Tan','Tany','Var','Vaish','Yam'];
    const femaleSuffixes = ['a','i','ya','ika','isha','iti','ana','ita','ali','avi','arsha','eeti','u','al','ini','anjali','deepa','eka','akshi','iya','ima','eta'];
    for (const p of prefixes) {
      for (const s of suffixes) {
        FIRST.push(p + s);
      }
    }
    for (const p of femalePrefixes) {
      for (const s of femaleSuffixes) {
        FIRST.push(p + s);
      }
    }

    // Generate surnames
    const baseLasts = [...LAST];
    const lastSuffixes = ['wala', 'kar', 'ti', 'ji', 'ya', 'th', 'ey', 'ry', 'ar', 'al'];
    for (const p of baseLasts.slice(0, 100)) {
      for (const s of lastSuffixes) {
        LAST.push(p + s);
      }
    }

    // Generate cities
    const cityPrefixes = ['Rampur','Kalyan','Gopalpur','Harihar','Naya','Sundar','Vijay','Anant','Dev','Raj','Krishna','Bheem','Jai','Ram','Shiva','Surya','Chandra','Brahma','Vishnu','Guru','Muni','Sant','Veer','Mahavir','Prem','Kanti','Kalyani','Dharma','Satya','Vidya','Ganga','Yamuna','Narmada','Saraswati','Sindhu','Kaveri','Godavari','Krishna','Tapti','Mahi','Sabarmati','Luni','Ghaggar','Chambal','Betwa','Ken','Sone','Damodar','Subarnarekha','Brahmani','Mahanadi','Indravati','Pranhita','Manair','Sabari','Sileru'];
    const citySuffixes = ['pur','abad','nagar','garh','durg','city','town','ganj','gaon','kheda','patnam','ur','ore','a','i','an','am','av','al','ar'];
    for (const p of cityPrefixes) {
      for (const s of citySuffixes) {
        CITIES.push(p + s);
      }
    }

    // Generate streets
    const streetBases = ['Mahatma Gandhi','Jawaharlal Nehru','Subhash Chandra Bose','Sardar Patel','Dr. Ambedkar','Swami Vivekananda','Bhagat Singh','Lal Bahadur Shastri','Rajendra Prasad','Rabindranath Tagore','Chhatrapati Shivaji','Rani Lakshmi Bai','Bal Gangadhar Tilak','Gopal Krishna Gokhale','Madan Mohan Malaviya','Abul Kalam Azad','Dadabhai Naoroji','Bipin Chandra Pal','Lala Lajpat Rai','Sri Aurobindo','Sarojini Naidu','Annie Besant','Motilal Nehru','Chittaranjan Das','C. Rajagopalachari','S. Radhakrishnan','Kamaraj','Periyar','V. O. Chidambaram Pillai','Subramania Bharati','Veerapandiya Kattabomman','Pazhassi Raja','Velu Thampi Dalawa','Sangolli Rayanna','Kittur Chennamma','Alluri Sitarama Raju','Potti Sreeramulu','Tanguturi Prakasam','Ujjwal','Vikram','Aditya','Cheetah','Tiger','Lion','Elephant','Peacock','Lotus','Banyan','Mango','Neem','Tulsi','Rose','Jasmine','Marigold','Sunflower'];
    const streetTypes = ['Road','Street','Lane','Marg','Path','Highway','Chowk','Avenue','Drive','Bypass','Link Road','Ring Road','Extension'];
    for (const b of streetBases) {
      for (const t of streetTypes) {
        STREETS.push(`${b} ${t}`);
      }
    }

    // Generate areas
    const landmarks = ['Railway Station','Bus Stand','City Mall','Post Office','Government School','General Hospital','Town Hall','Hanuman Temple','Municipal Office','University Campus','Central Park','Public Library','Police Station','Fire Station','Water Tank','Clock Tower','Metro Station','High Court','District Court','Stadium','Lake Garden','Botanical Garden','Zoo','Museum','Science Center'];
    const positions = ['Near','Opposite','Behind','Beside','Next to','Close to','Across from','In front of','Adjacent to'];
    const zones = ['Sector','Block','Phase','Pocket','Ward','Zone','Scheme','Layout'];
    for (const p of positions) {
      for (const l of landmarks) {
        AREAS.push(`${p} ${l}`);
      }
    }
    for (const z of zones) {
      for (let i = 1; i <= 100; i++) {
        AREAS.push(`${z} ${i}`);
      }
    }

    // Generate PINs
    const pinPrefixes = ['380','395','390','360','361','400','411','110','560','600','700','302','500'];
    for (const p of pinPrefixes) {
      for (let i = 1; i <= 100; i++) {
        PINS.push(`${p}${String(i).padStart(3, '0')}`);
      }
    }
  })();

  // ── Session identity (re-generated on every fill run) ────────────────────
  let firstName, lastName, fullName, city, state, pin, address;
  let rawPhone, phone, altRaw, altPhone, email;
  let startTime, endTime;

  function regenerateIdentity() {
    firstName  = pick(FIRST);
    lastName   = pick(LAST);
    fullName   = `${firstName} ${lastName}`;
    city       = pick(CITIES);
    state      = pick(STATES);
    pin        = pick(PINS);
    address    = `${rn(1, 999)}, ${pick(STREETS)}, ${pick(AREAS)}, ${city} - ${pin}`;

    rawPhone   = pick(['6','7','8','9']) + digs(9);
    phone      = `+91 ${rawPhone.slice(0,5)} ${rawPhone.slice(5)}`;
    altRaw     = pick(['6','7','8','9']) + digs(9);
    altPhone   = `+91 ${altRaw.slice(0,5)} ${altRaw.slice(5)}`;
    email      = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rn(1, 99)}@${pick(EMAIL_DOMAINS)}`;

    const sH = rn(8, 14), eH = rn(sH + 3, Math.min(sH + 10, 23));
    startTime  = `${String(sH).padStart(2,'0')}:${pick(['00','30'])}`;
    endTime    = `${String(eH).padStart(2,'0')}:${pick(['00','30'])}`;
  }

  // Initialize once on load
  regenerateIdentity();

  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const futureDate = (minD = 0, maxD = 365) => fmt(new Date(Date.now() + (minD + Math.random()*(maxD-minD))*86400000));
  const pastDate   = (minY, maxY) => fmt(new Date(Date.now() - (minY + Math.random()*(maxY-minY))*365.25*86400000));

  const formatBirthDate = (key, label, placeholder, type) => {
    const minY = 20;
    const maxY = 50;
    const d = new Date(Date.now() - (minY + Math.random()*(maxY-minY))*365.25*86400000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // Native date inputs always require YYYY-MM-DD
    if (type === 'date') return `${year}-${month}-${day}`;
    
    const combined = `${key} ${label} ${placeholder}`.toLowerCase();
    
    if (/dd[-\/.]mm[-\/.]yyyy/i.test(combined)) {
      const sep = combined.includes('/') ? '/' : (combined.includes('.') ? '.' : '-');
      return `${day}${sep}${month}${sep}${year}`;
    }
    if (/mm[-\/.]dd[-\/.]yyyy/i.test(combined)) {
      const sep = combined.includes('/') ? '/' : (combined.includes('.') ? '.' : '-');
      return `${month}${sep}${day}${sep}${year}`;
    }
    if (/yyyy[-\/.]mm[-\/.]dd/i.test(combined)) {
      const sep = combined.includes('/') ? '/' : (combined.includes('.') ? '.' : '-');
      return `${year}${sep}${month}${sep}${day}`;
    }
    
    // Default: YYYY-MM-DD (universal standard)
    return `${year}-${month}-${day}`;
  };

  const aadhar = () => `${digs(4)} ${digs(4)} ${digs(4)}`;
  const pan    = () => { const L='ABCDEFGHIJKLMNOPQRSTUVWXYZ', l=()=>L[rn(0,25)]; return `${l()}${l()}${l()}${l()}${l()}${rn(1000,9999)}${l()}`; };

  // ── Value rules (match key → value generator) ────────────────────────────
  const RULES = [
    { match: ['firstname','fname'],                  value: () => firstName },
    { match: ['lastname','lname','surname'],          value: () => lastName },
    { match: ['dateofbirth','dob','birthdate','birthday','birth'], value: (key, label, placeholder, type) => formatBirthDate(key, label, placeholder, type) },
    { match: ['fullname','customername','contactname','name'], value: () => fullName },
    { match: ['email'],                              value: () => email },
    { match: ['starttime'],                          value: () => startTime },
    { match: ['endtime'],                            value: () => endTime },
    { match: ['alternatephone','altphone','alternativephone'], value: () => altPhone },
    { match: ['phone','mobile','tel','customerphone','contactnumber'], value: () => phone },
    { match: ['currentaddress','permanentaddress','address'], value: () => address },
    { match: ['postalcode','postal','pincode','zip','pin'], value: () => pin },
    { match: ['city'],                               value: () => city },
    { match: ['state','province'],                   value: () => state },
    { match: ['nationality'],                        value: () => NATIONALITY },
    { match: ['country'],                            value: () => 'India' },
    { match: ['reportingmanager','manager'],         value: () => `${pick(FIRST)} ${pick(LAST)}` },
    { match: ['relation','relationship'],            value: () => pick(['Father','Mother','Spouse','Brother','Sister']) },
    { match: ['probationperiod'],                    value: () => pick([90,180]) },
    { match: ['noticeperiod'],                       value: () => pick([30,60,90]) },
    { match: ['annualctc','ctc'],                    value: () => rn(300000,2500000) },
    { match: ['salary'],                             value: () => rn(25000,150000) },
    { match: ['offerprice'],                         value: () => rn(100,2000) },
    { match: ['price','amount','cost'],              value: () => rn(200,5000) },
    { match: ['duration'],                           value: () => pick([30,45,60,90,120]) },
    { match: ['totalseats','seats','capacity'],      value: () => rn(2,20) },
    { match: ['aadharnumber','aadhar','aadhaar'],    value: () => aadhar() },
    { match: ['pannumber','pan'],                    value: () => pan() },
    { match: ['accountholdername'],                  value: () => fullName },
    { match: ['bankname','bank'],                    value: () => pick(BANKS) },
    { match: ['accountnumber','account'],            value: () => digs(rn(10,16)) },
    { match: ['ifsccode','ifsc'],                    value: () => `${pick(IFSC_CODES)}0${digs(6)}` },
    { match: ['branch'],                             value: () => city },
    { match: ['uannumber','uan'],                    value: () => digs(12) },
    { match: ['pfnumber','pf'],                      value: () => `PF${digs(10)}` },
    { match: ['esinumber','esi'],                    value: () => digs(17) },
    { match: ['description','desc'],                 value: () => 'Premium quality service for valued customers.' },
    { match: ['worklocation','location'],            value: () => city },
    { match: ['joiningdate','joining','joindate'],   value: () => futureDate(1,90) },
    { match: ['confirmationdate'],                   value: () => futureDate(90,365) },
    { match: ['bloodgroup','blood'],                 value: () => pick(BLOOD_GROUPS) },
    { match: ['designation','jobtitle'],             value: () => pick(DESIGNATIONS) },
    { match: ['department','dept'],                  value: () => pick(DEPARTMENTS) },
    { match: ['gender','sex'],                       value: () => pick(['Male','Female','Other']) },
    { match: ['maritalstatus','marital'],            value: () => pick(['Single','Married','Divorced','Widowed']) },
    { match: ['referralcode','referral'],            value: () => `KRP${rn(100000,999999)}` },
    { match: ['shopcode'],                           value: () => `SH${digs(4)}` },
    { match: ['note','comment','remark'],            value: () => 'No additional remarks.' },
  ];

  // ── Select option matchers ────────────────────────────────────────────────
  const getOptText = o => {
    if (!o) return '';
    if (typeof o === 'string') return o;
    return String(o.text || o.label || o.name || o.title || o.displayName || o.value || o);
  };

  const SELECT_RULES = [
    { match: ['gender','sex'],        pick: opts => opts.find(o => /male|female|other/i.test(getOptText(o))) },
    { match: ['blood'],               pick: opts => opts.find(o => BLOOD_GROUPS.includes(getOptText(o).trim())) },
    { match: ['department','dept'],   pick: opts => opts.find(o => DEPARTMENTS.some(d => _norm(getOptText(o)).includes(_norm(d)))) },
    { match: ['designation','role','position'], pick: opts => opts.find(o => DESIGNATIONS.some(d => _norm(getOptText(o)).includes(_norm(d)))) },
    { match: ['bank'],                pick: opts => opts.find(o => BANKS.some(b => _norm(getOptText(o)).includes(_norm(b)))) },
    { match: ['state','province'],    pick: opts => opts.find(o => /gujarat|maharashtra|delhi|karnataka/i.test(getOptText(o))) },
    { match: ['nationality'],         pick: opts => opts.find(o => /indian/i.test(getOptText(o))) },
    { match: ['country'],             pick: opts => opts.find(o => /india/i.test(getOptText(o))) },
    { match: ['marital'],             pick: opts => opts.find(o => /single|married/i.test(getOptText(o))) },
    { match: ['relation'],            pick: opts => opts.find(o => /father|mother|spouse|brother|sister/i.test(getOptText(o))) },
  ];

  function _norm(s) { return String(s).toLowerCase().replace(/[-_\s[\]./*]/g,''); }

  function resolveText(key, label, placeholder, type) {
    const c = _norm(`${key} ${label} ${placeholder}`);
    for (const rule of RULES) {
      if (rule.match.some(p => c.includes(p))) {
        const val = rule.value(key, label, placeholder, type);
        // Skip rules that produce non-numeric strings for number inputs —
        // setting a string on input[type="number"] throws a DOMException.
        if (type === 'number' && isNaN(Number(String(val)))) continue;
        
        // Skip rules that do not match date/time formats
        if (type === 'time' && !/^\d{2}:\d{2}(:\d{2})?$/.test(String(val))) continue;
        if (type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(val))) continue;
        if (type === 'datetime-local' && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(String(val))) continue;

        return val;
      }
    }
    if (type === 'email')    return email;
    if (type === 'tel')      return phone;
    if (type === 'number')   return null;
    if (type === 'time')     return pick([startTime, endTime]);
    if (type === 'date')     return futureDate(1, 90);
    if (type === 'datetime-local') return `${futureDate(1, 10)}T${pick([startTime, endTime])}`;
    if (type === 'textarea') return address;
    if (/name/.test(c))      return fullName;
    if (/code/.test(c))      return digs(6);
    if (/number/.test(c))    return digs(10);
    return null;
  }

  function resolveSelect(key, label, opts) {
    const c = _norm(`${key} ${label}`);
    for (const rule of SELECT_RULES) {
      if (rule.match.some(p => c.includes(p))) {
        const found = rule.pick(opts);
        if (found) return found;
      }
    }
    return null;
  }

  // ── Krisper Specific Static Data ──────────────────────────────────────────
  const KRISPER_SERVICE_NAMES = [
    'Haircut & Styling', 'Beard Grooming', 'Shave & Trim', 'Hair Spa', 'Facial & Clean-up',
    'Hair Coloring', 'Head Massage', 'Pedicure', 'Manicure', 'Face Bleach',
    'De-Tan Pack', 'Keratin Treatment', 'Hair Straightening'
  ];

  const KRISPER_SHOP_NAMES = [
    'Krisper Premium Salon', 'Scissors & Spades', 'The Barber Station',
    'Royal Grooming Lounge', 'Glitz & Glamour Studio'
  ];

  const KRISPER_OFFER_NAMES = [
    'Festive Discount', 'Weekend Pamper Deal', 'Monsoon Hair Care Special',
    'First Time User Discount', 'Mid-week Special Offer', 'Krisper Birthday Treat'
  ];

  const KRISPER_DESCRIPTION_TEMPLATES = [
    'Premium quality grooming and styling service customized for you.',
    'Experience the best styling with our expert professionals.',
    'Complete hair spa treatment using premium organic products.',
    'Includes deep cleansing, scrub, massage, and hydrating pack.'
  ];

  const KRISPER_OPTION_BADGES = [
    'Wash & Blowdry', 'Hot Towel Treatment', 'Premium Oil Massage',
    'Hydrating Gel Mask', 'Argan Oil Serum Apply', 'Beard Waxing Styling'
  ];

  return {
    resolveText,
    resolveSelect,
    regenerateIdentity,
    futureDate,
    pastDate,
    pick,
    rn,
    digs,
    _norm,
    get startTime()  { return startTime; },
    get endTime()    { return endTime; },
    bloodGroups: BLOOD_GROUPS,
    states:      STATES,
    firstNames:  FIRST,
    lastNames:   LAST,
    krisperServices: KRISPER_SERVICE_NAMES,
    krisperShops: KRISPER_SHOP_NAMES,
    krisperOffers: KRISPER_OFFER_NAMES,
    krisperDescriptions: KRISPER_DESCRIPTION_TEMPLATES,
    krisperOptions: KRISPER_OPTION_BADGES,
  };
})();
