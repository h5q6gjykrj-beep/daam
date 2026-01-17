export const COLLEGES = [
  { 
    value: 'foundation', 
    labelAr: 'التأسيسي (الفاونديشن)', 
    labelEn: 'Foundation',
    color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    buttonColor: 'bg-violet-500 hover:bg-violet-600 text-white border-violet-600'
  },
  { 
    value: 'economics', 
    labelAr: 'الاقتصاد وإدارة الأعمال', 
    labelEn: 'Economics & Business Administration',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    buttonColor: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
  },
  { 
    value: 'applied-sciences', 
    labelAr: 'العلوم التطبيقية والصيدلة', 
    labelEn: 'Applied Sciences & Pharmacy',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
  },
  { 
    value: 'engineering', 
    labelAr: 'الهندسة والتكنولوجيا', 
    labelEn: 'Engineering & Technology',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    buttonColor: 'bg-slate-500 hover:bg-slate-600 text-white border-slate-600'
  },
  { 
    value: 'computer-science', 
    labelAr: 'علوم الحاسوب والمعلومات', 
    labelEn: 'Computer Science & Information Systems',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600'
  },
  { 
    value: 'creative-industries', 
    labelAr: 'الصناعات الإبداعية', 
    labelEn: 'Creative Industries',
    color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    buttonColor: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-fuchsia-600'
  },
  { 
    value: 'other', 
    labelAr: 'أخرى', 
    labelEn: 'Other',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    buttonColor: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600'
  }
];

export const getCollegeInfo = (value: string) => {
  return COLLEGES.find(c => c.value === value);
};

export const getCollegeLabel = (value: string, lang: 'ar' | 'en') => {
  const college = getCollegeInfo(value);
  if (!college) return value;
  return lang === 'ar' ? college.labelAr : college.labelEn;
};

export const getCollegeColor = (value: string) => {
  const college = getCollegeInfo(value);
  return college?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};
