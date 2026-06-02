/**
 * CopilotX — Indian fake data provider
 * Swap this file with an AI-powered provider in the future without touching content.js
 */
window.COPILOTX_DATA = (() => {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const rn   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const digs = n => Array.from({ length: n }, () => rn(0, 9)).join('');

  // ── Names ──────────────────────────────────────────────────────────────────
  const FIRST = [
    'Aarav','Arjun','Vihaan','Reyan','Aditya','Dhruv','Rohan','Ishaan','Parth','Yash',
    'Priya','Sneha','Pooja','Kavya','Ananya','Neha','Meera','Divya','Shruti','Nisha',
    'Hardik','Vatsal','Raj','Kiran','Amit','Vijay','Sanjay','Deepak','Rahul','Kushal',
    'Nikhil','Ritesh','Sachin','Suresh','Mahesh','Rakesh','Ramesh','Dinesh','Ganesh','Naresh',
    'Vivek','Manish','Rajesh','Praveen','Sunil','Anil','Pankaj','Ajay','Manoj','Vikas',
    'Akash','Ankit','Ankur','Ashish','Gaurav','Lalit','Lokesh','Mohit','Neeraj','Nitin',
    'Preeti','Ritu','Sunita','Sushma','Asha','Lata','Usha','Rekha','Madhu','Kavitha',
    'Lakshmi','Radha','Geeta','Sita','Parvati','Durga','Saraswati','Uma','Malti','Vimla',
    'Farhan','Imran','Salman','Aryan','Ayaan','Zara','Fatima','Amira','Saniya','Riya',
    'Tanvi','Tanya','Trisha','Aisha','Sana','Naina','Pari','Khushi','Simran','Gurpreet',
    'Harpreet','Jaspreet','Manpreet','Navneet','Paramjeet','Sukhwinder','Balwinder','Rajinder','Surinder','Davinder',
    'Mohan','Sohan','Roshan','Kishan','Chetan','Bhavesh','Jignesh','Hiren','Nilesh','Chirag',
    'Vishal','Viral','Krunal','Kuntal','Dhaval','Bhavin','Alpesh','Dipesh','Jigar','Tejal',
    'Riddhi','Siddhi','Bhoomi','Foram','Monal','Pinal','Ami','Hetal','Komal','Shreya',
    'Kriti','Kritika','Aditi','Ahana','Ishika','Rashi','Palak','Sakshi','Swati','Harsha',
    'Deepika','Sonam','Shilpa','Shweta','Aarti','Bharti','Kirti','Mamta','Jyoti','Jhanvi',
    'Janvi','Nidhi','Ridhi','Vidhi','Vrinda','Vrishti','Vanshi','Vani','Kapil','Kamal',
    'Keshav','Kartik','Kunal','Kabir','Kaushik','Kalpesh','Bharat','Bhavik','Bhavna','Bhushan',
    'Prabhat','Prashant','Prasad','Prakash','Pramod','Pradeep','Pravin','Pravesh','Prem','Paresh',
  ];

  const LAST = [
    'Sharma','Patel','Shah','Mehta','Joshi','Desai','Gupta','Singh','Kumar','Verma',
    'Bhalodiya','Makwana','Solanki','Rathod','Chauhan','Jadeja','Parmar','Thakkar','Soni','Rajput',
    'Agarwal','Bansal','Mittal','Goel','Khanna','Malhotra','Kapoor','Bhatia','Chopra','Anand',
    'Tiwari','Mishra','Pandey','Shukla','Yadav','Chaudhary','Maurya','Pal','Saha','Das',
    'Nair','Pillai','Menon','Iyer','Iyengar','Reddy','Naidu','Rao','Chari','Rajan',
    'Mukherjee','Chatterjee','Banerjee','Ghosh','Sen','Roy','Bose','Dutta','Mitra','Chakraborty',
    'Bhatt','Trivedi','Pandya','Dave','Sheth','Vora','Bhavsar','Raval','Nayak','Khatri',
    'Mistry','Modi','Nanavati','Shroff','Dalal','Doshi','Gajjar','Inamdar','Jhaveri','Zaveri',
    'Kulkarni','Lele','Mane','Naik','Parekh','Pathak','Ranade','Sathe','Shinde','Bhosale',
    'Sheikh','Khan','Siddiqui','Ansari','Qureshi','Mirza','Hussain','Ali','Ahmed','Malik',
    'Grewal','Dhillon','Sidhu','Brar','Gill','Sandhu','Cheema','Virk','Bajwa','Bains',
    'Chandra','Dubey','Garg','Handa','Irani','Jain','Kaul','Lamba','Nagpal','Oberoi',
    'Prasad','Saxena','Tandon','Upadhyay','Vaswani','Wagh','Kohli','Mehra','Narang','Suri',
    'Acharya','Bedi','Chadha','Deol','Goenka','Jolly','Raghunathan','Venkat','Thakur','Lal',
    'Subramaniam','Krishnamurthy','Swaminathan','Venkatesan','Narayanan','Balakrishnan','Sundaram','Ramachandran',
  ];

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

  const NATIONALITIES = [
    'Indian','Indian','Indian','Indian','Indian',
  ];

  const STREETS = [
    'MG Road','Station Road','Gandhi Nagar','Nehru Chowk','Ashram Road','Ring Road','Relief Road',
    'Navrangpura','Satellite Road','CG Road','Kalanala','SG Highway','Civil Lines','Mall Road',
    'Brigade Road','Residency Road','Anna Salai','Nungambakkam High Road','T Nagar Main Road',
    'Park Street','Camac Street','AJC Bose Road','Chittaranjan Avenue','Linking Road','SV Road',
    'LBS Marg','Eastern Express Highway','Marine Drive','Connaught Place','Janpath','Lodhi Road',
    'Banjara Hills Road','Jubilee Hills Road','Hitech City Road','FC Road','JM Road','Baner Road',
    'Koregaon Park Road','Tilak Road','Law College Road','Karve Road','Senapati Bapat Road',
  ];

  const AREAS = [
    'Near Railway Station','Opposite Bus Stand','Main Chowk','Sector 12','Block B',
    'Near City Mall','Behind Post Office','Opposite School','Near Hospital','Main Market Area',
    'Industrial Area','Residential Colony','Phase 1','Phase 2','Phase 3',
    'Extension Area','Civil Lines Area','Heritage Area','Commercial Zone','IT Park Area',
  ];

  const BANKS = [
    'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank',
    'Bank of Baroda','Punjab National Bank','Canara Bank','Union Bank of India',
    'IndusInd Bank','Yes Bank','IDFC First Bank','Federal Bank','South Indian Bank','Karnataka Bank',
  ];

  const IFSC_CODES = ['SBIN','HDFC','ICIC','UTIB','KKBK','BARB','PUNB','CNRB','UBIN','INDB','YESB','IDFB','FDRL','SIBL','KARB'];

  const DESIGNATIONS = [
    'Software Engineer','Senior Developer','Team Lead','Project Manager','HR Executive',
    'Sales Manager','Accountant','Operations Manager','Business Analyst','UI/UX Designer',
    'DevOps Engineer','QA Engineer','Data Analyst','Product Manager','Marketing Executive',
  ];

  const DEPARTMENTS = [
    'Engineering','Human Resources','Sales','Finance','Operations',
    'Marketing','Administration','Legal','IT Support','Customer Service',
    'Research & Development','Quality Assurance',
  ];

  const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const EMAIL_DOMAINS = ['gmail.com','yahoo.in','rediffmail.com','outlook.in','yahoo.com','hotmail.com'];
  const PINS = ['380001','380006','395001','390001','360001','361001','400001','411001','110001','560001','600001','700001','302001','500001','600017','411005','380015','395003','390007','382007'];

  // ── Session identity (consistent within one fill run) ────────────────────
  const firstName  = pick(FIRST);
  const lastName   = pick(LAST);
  const fullName   = `${firstName} ${lastName}`;
  const city       = pick(CITIES);
  const state      = pick(STATES);
  const pin        = pick(PINS);
  const address    = `${rn(1, 999)}, ${pick(STREETS)}, ${pick(AREAS)}, ${city} - ${pin}`;
  const phone      = Math.random() < 0.5
    ? `+91 ${pick(['6','7','8','9'])}${digs(4)} ${digs(5)}`
    : pick(['6','7','8','9']) + digs(9);
  const altPhone   = pick(['6','7','8','9']) + digs(9);
  const email      = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rn(1, 99)}@${pick(EMAIL_DOMAINS)}`;

  const sH = rn(8, 14), eH = rn(sH + 3, Math.min(sH + 10, 23));
  const startTime  = `${String(sH).padStart(2,'0')}:${pick(['00','30'])}`;
  const endTime    = `${String(eH).padStart(2,'0')}:${pick(['00','30'])}`;

  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const futureDate = (minD = 0, maxD = 365) => fmt(new Date(Date.now() + (minD + Math.random()*(maxD-minD))*86400000));
  const pastDate   = (minY, maxY) => fmt(new Date(Date.now() - (minY + Math.random()*(maxY-minY))*365.25*86400000));

  const aadhar = () => `${digs(4)} ${digs(4)} ${digs(4)}`;
  const pan    = () => { const L='ABCDEFGHIJKLMNOPQRSTUVWXYZ', l=()=>L[rn(0,25)]; return `${l()}${l()}${l()}${l()}${l()}${rn(1000,9999)}${l()}`; };

  // ── Value rules (match key → value generator) ────────────────────────────
  const RULES = [
    { match: ['firstname','fname'],                  value: () => firstName },
    { match: ['lastname','lname','surname'],          value: () => lastName },
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
    { match: ['nationality'],                        value: () => pick(NATIONALITIES) },
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
  const SELECT_RULES = [
    { match: ['gender','sex'],        pick: opts => opts.find(o => /male|female|other/i.test(o.text||o.label||o)) },
    { match: ['blood'],               pick: opts => opts.find(o => BLOOD_GROUPS.includes((o.text||o.label||o).trim())) },
    { match: ['department','dept'],   pick: opts => opts.find(o => DEPARTMENTS.some(d => _norm(o.text||o.label||o).includes(_norm(d)))) },
    { match: ['designation','role','position'], pick: opts => opts.find(o => DESIGNATIONS.some(d => _norm(o.text||o.label||o).includes(_norm(d)))) },
    { match: ['bank'],                pick: opts => opts.find(o => BANKS.some(b => _norm(o.text||o.label||o).includes(_norm(b)))) },
    { match: ['state','province'],    pick: opts => opts.find(o => /gujarat|maharashtra|delhi|karnataka/i.test(o.text||o.label||o)) },
    { match: ['nationality'],         pick: opts => opts.find(o => /indian/i.test(o.text||o.label||o)) },
    { match: ['country'],             pick: opts => opts.find(o => /india/i.test(o.text||o.label||o)) },
    { match: ['marital'],             pick: opts => opts.find(o => /single|married/i.test(o.text||o.label||o)) },
    { match: ['relation'],            pick: opts => opts.find(o => /father|mother|spouse|brother|sister/i.test(o.text||o.label||o)) },
  ];

  function _norm(s) { return String(s).toLowerCase().replace(/[-_\s[\]./*]/g,''); }

  function resolveText(key, label, placeholder, type) {
    const c = _norm(`${key} ${label} ${placeholder}`);
    for (const rule of RULES) {
      if (rule.match.some(p => c.includes(p))) {
        const val = rule.value();
        // Skip rules that produce non-numeric strings for number inputs —
        // setting a string on input[type="number"] throws a DOMException.
        if (type === 'number' && isNaN(Number(String(val)))) continue;
        return val;
      }
    }
    if (type === 'email')    return email;
    if (type === 'tel')      return phone;
    if (type === 'number')   return null;
    if (type === 'time')     return pick([startTime, endTime]);
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

  return {
    resolveText,
    resolveSelect,
    futureDate,
    pastDate,
    pick,
    rn,
    digs,
    _norm,
    startTime,
    endTime,
    bloodGroups: BLOOD_GROUPS,
    states:      STATES,
  };
})();
