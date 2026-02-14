const CITIES_DATABASE = {
    SA: {
        name_ar: 'السعودية',
        name_en: 'Saudi Arabia',
        patterns: ['Saudi Arabia', 'السعودية', 'KSA', 'المملكة العربية السعودية'],
        cities: [
            { standard: 'Riyadh', variants: ['Riyadh', 'الرياض', 'رياض'] },
            { standard: 'Jeddah', variants: ['Jeddah', 'Jiddah', 'جدة', 'جده', 'Jedda'] },
            { standard: 'Mecca', variants: ['Mecca', 'Makkah', 'مكة', 'مكه', 'مكة المكرمة'] },
            { standard: 'Medina', variants: ['Medina', 'Madinah', 'المدينة', 'المدينة المنورة', 'المدينه'] },
            { standard: 'Dammam', variants: ['Dammam', 'الدمام'] },
            { standard: 'Khobar', variants: ['Khobar', 'Al Khobar', 'الخبر'] },
            { standard: 'Dhahran', variants: ['Dhahran', 'الظهران'] },
            { standard: 'Tabuk', variants: ['Tabuk', 'تبوك'] },
            { standard: 'Abha', variants: ['Abha', 'أبها'] },
            { standard: 'Taif', variants: ['Taif', "Ta'if", 'الطائف', 'الطايف'] },
            { standard: 'Jubail', variants: ['Jubail', 'الجبيل'] },
            { standard: 'Yanbu', variants: ['Yanbu', 'ينبع'] },
            { standard: 'Buraidah', variants: ['Buraidah', 'Buraydah', 'بريدة', 'بريده'] },
            { standard: 'Khamis Mushait', variants: ['Khamis Mushait', 'Khamis Mushit', 'خميس مشيط'] },
            { standard: 'Najran', variants: ['Najran', 'نجران'] },
            { standard: 'Hail', variants: ['Hail', "Ha'il", 'حائل', 'حايل'] },
            { standard: 'Jazan', variants: ['Jazan', 'Jizan', 'جازان', 'جيزان'] },
            { standard: 'Al Ahsa', variants: ['Al Ahsa', 'Al-Ahsa', 'الاحساء', 'الأحساء'] },
            { standard: 'Qatif', variants: ['Qatif', 'القطيف'] },
            { standard: 'Sakaka', variants: ['Sakaka', 'سكاكا'] },
            { standard: 'Arar', variants: ['Arar', 'عرعر'] },
            { standard: 'Al Baha', variants: ['Al Baha', 'Al Bahah', 'الباحة', 'الباحه'] },
            { standard: 'Bisha', variants: ['Bisha', 'Bishah', 'بيشة', 'بيشه'] },
            { standard: 'Unaizah', variants: ['Unaizah', 'Unizah', 'عنيزة', 'عنيزه'] },
            { standard: 'Al Kharj', variants: ['Al Kharj', 'الخرج'] },
            { standard: 'Wadi Al Dawasir', variants: ['Wadi Al Dawasir', 'Wadi ad Dawasir', 'وادي الدواسر'] },
            { standard: 'Al Qunfudhah', variants: ['Al Qunfudhah', 'القنفذة', 'القنفذه'] },
            { standard: 'Rafha', variants: ['Rafha', 'رفحاء'] },
            { standard: 'Dawadmi', variants: ['Dawadmi', 'Ad Dawadimi', 'الدوادمي'] },
            { standard: 'Afif', variants: ['Afif', 'عفيف'] }
        ]
    },
    EG: {
        name_ar: 'مصر',
        name_en: 'Egypt',
        patterns: ['Egypt', 'مصر', 'جمهورية مصر العربية'],
        cities: [
            { standard: 'Cairo', variants: ['Cairo', 'القاهرة', 'القاهره'] },
            { standard: 'Alexandria', variants: ['Alexandria', 'الإسكندرية', 'الاسكندرية', 'الاسكندريه'] },
            { standard: 'Giza', variants: ['Giza', 'الجيزة', 'الجيزه'] },
            { standard: 'Shubra El Kheima', variants: ['Shubra El Kheima', 'شبرا الخيمة'] },
            { standard: 'Port Said', variants: ['Port Said', 'بورسعيد'] },
            { standard: 'Suez', variants: ['Suez', 'السويس'] },
            { standard: 'Luxor', variants: ['Luxor', 'الأقصر', 'الاقصر'] },
            { standard: 'Aswan', variants: ['Aswan', 'أسوان', 'اسوان'] },
            { standard: 'Mansoura', variants: ['Mansoura', 'Mansura', 'المنصورة', 'المنصوره'] },
            { standard: 'Tanta', variants: ['Tanta', 'طنطا'] },
            { standard: 'Ismailia', variants: ['Ismailia', 'الإسماعيلية', 'الاسماعيلية'] },
            { standard: 'Faiyum', variants: ['Faiyum', 'Fayoum', 'الفيوم'] },
            { standard: 'Zagazig', variants: ['Zagazig', 'الزقازيق'] },
            { standard: 'Damietta', variants: ['Damietta', 'دمياط'] },
            { standard: 'Asyut', variants: ['Asyut', 'Assiut', 'أسيوط', 'اسيوط'] },
            { standard: 'Minya', variants: ['Minya', 'المنيا'] },
            { standard: 'Beni Suef', variants: ['Beni Suef', 'بني سويف'] },
            { standard: 'Sohag', variants: ['Sohag', 'سوهاج'] },
            { standard: 'Hurghada', variants: ['Hurghada', 'الغردقة'] },
            { standard: 'Sharm El Sheikh', variants: ['Sharm El Sheikh', 'شرم الشيخ'] },
            { standard: '6th of October', variants: ['6th of October', '6 October', 'السادس من أكتوبر', 'اكتوبر'] },
            { standard: 'New Cairo', variants: ['New Cairo', 'القاهرة الجديدة', 'التجمع'] },
            { standard: 'Nasr City', variants: ['Nasr City', 'مدينة نصر'] },
            { standard: 'Heliopolis', variants: ['Heliopolis', 'مصر الجديدة'] },
            { standard: 'Maadi', variants: ['Maadi', 'المعادي'] },
            { standard: 'Dokki', variants: ['Dokki', 'الدقي'] },
            { standard: 'Mohandessin', variants: ['Mohandessin', 'المهندسين'] }
        ]
    },
    AE: {
        name_ar: 'الإمارات',
        name_en: 'United Arab Emirates',
        patterns: ['United Arab Emirates', 'UAE', 'الإمارات', 'الامارات'],
        cities: [
            { standard: 'Dubai', variants: ['Dubai', 'دبي'] },
            { standard: 'Abu Dhabi', variants: ['Abu Dhabi', 'أبوظبي', 'ابوظبي', 'أبو ظبي'] },
            { standard: 'Sharjah', variants: ['Sharjah', 'الشارقة', 'الشارقه'] },
            { standard: 'Ajman', variants: ['Ajman', 'عجمان'] },
            { standard: 'Ras Al Khaimah', variants: ['Ras Al Khaimah', 'Ras al-Khaimah', 'رأس الخيمة'] },
            { standard: 'Fujairah', variants: ['Fujairah', 'الفجيرة', 'الفجيره'] },
            { standard: 'Umm Al Quwain', variants: ['Umm Al Quwain', 'أم القيوين'] },
            { standard: 'Al Ain', variants: ['Al Ain', 'العين'] }
        ]
    },
    KW: {
        name_ar: 'الكويت',
        name_en: 'Kuwait',
        patterns: ['Kuwait', 'الكويت'],
        cities: [
            { standard: 'Kuwait City', variants: ['Kuwait City', 'مدينة الكويت', 'الكويت'] },
            { standard: 'Hawalli', variants: ['Hawalli', 'حولي'] },
            { standard: 'Salmiya', variants: ['Salmiya', 'السالمية'] },
            { standard: 'Jahra', variants: ['Jahra', 'الجهراء'] },
            { standard: 'Farwaniya', variants: ['Farwaniya', 'الفروانية'] },
            { standard: 'Ahmadi', variants: ['Ahmadi', 'الأحمدي'] },
            { standard: 'Mangaf', variants: ['Mangaf', 'المنقف'] },
            { standard: 'Sabah Al Salem', variants: ['Sabah Al Salem', 'صباح السالم'] }
        ]
    },
    BH: {
        name_ar: 'البحرين',
        name_en: 'Bahrain',
        patterns: ['Bahrain', 'البحرين'],
        cities: [
            { standard: 'Manama', variants: ['Manama', 'المنامة', 'المنامه'] },
            { standard: 'Muharraq', variants: ['Muharraq', 'المحرق'] },
            { standard: 'Riffa', variants: ['Riffa', 'الرفاع'] },
            { standard: 'Hamad Town', variants: ['Hamad Town', 'مدينة حمد'] },
            { standard: 'Isa Town', variants: ['Isa Town', 'مدينة عيسى'] }
        ]
    },
    OM: {
        name_ar: 'عُمان',
        name_en: 'Oman',
        patterns: ['Oman', 'عمان', 'سلطنة عمان'],
        cities: [
            { standard: 'Muscat', variants: ['Muscat', 'مسقط'] },
            { standard: 'Salalah', variants: ['Salalah', 'صلالة', 'صلاله'] },
            { standard: 'Sohar', variants: ['Sohar', 'صحار'] },
            { standard: 'Nizwa', variants: ['Nizwa', 'نزوى'] },
            { standard: 'Sur', variants: ['Sur', 'صور'] },
            { standard: 'Ibri', variants: ['Ibri', 'عبري'] },
            { standard: 'Seeb', variants: ['Seeb', 'Al Seeb', 'السيب'] },
            { standard: 'Barka', variants: ['Barka', 'بركاء'] }
        ]
    },
    QA: {
        name_ar: 'قطر',
        name_en: 'Qatar',
        patterns: ['Qatar', 'قطر'],
        cities: [
            { standard: 'Doha', variants: ['Doha', 'الدوحة', 'الدوحه'] },
            { standard: 'Al Wakrah', variants: ['Al Wakrah', 'الوكرة', 'الوكره'] },
            { standard: 'Al Khor', variants: ['Al Khor', 'الخور'] },
            { standard: 'Umm Salal', variants: ['Umm Salal', 'أم صلال'] },
            { standard: 'Lusail', variants: ['Lusail', 'لوسيل'] },
            { standard: 'Al Rayyan', variants: ['Al Rayyan', 'الريان'] }
        ]
    },
    JO: {
        name_ar: 'الأردن',
        name_en: 'Jordan',
        patterns: ['Jordan', 'الأردن', 'الاردن'],
        cities: [
            { standard: 'Amman', variants: ['Amman', 'عمان', 'عمّان'] },
            { standard: 'Zarqa', variants: ['Zarqa', 'الزرقاء'] },
            { standard: 'Irbid', variants: ['Irbid', 'إربد', 'اربد'] },
            { standard: 'Aqaba', variants: ['Aqaba', 'العقبة', 'العقبه'] },
            { standard: 'Salt', variants: ['Salt', 'السلط'] },
            { standard: 'Madaba', variants: ['Madaba', 'مادبا'] },
            { standard: 'Jerash', variants: ['Jerash', 'جرش'] },
            { standard: 'Mafraq', variants: ['Mafraq', 'المفرق'] }
        ]
    },
    IQ: {
        name_ar: 'العراق',
        name_en: 'Iraq',
        patterns: ['Iraq', 'العراق'],
        cities: [
            { standard: 'Baghdad', variants: ['Baghdad', 'بغداد'] },
            { standard: 'Basra', variants: ['Basra', 'البصرة', 'البصره'] },
            { standard: 'Erbil', variants: ['Erbil', 'Arbil', 'أربيل', 'اربيل'] },
            { standard: 'Mosul', variants: ['Mosul', 'الموصل'] },
            { standard: 'Sulaymaniyah', variants: ['Sulaymaniyah', 'السليمانية'] },
            { standard: 'Najaf', variants: ['Najaf', 'النجف'] },
            { standard: 'Karbala', variants: ['Karbala', 'كربلاء'] },
            { standard: 'Kirkuk', variants: ['Kirkuk', 'كركوك'] },
            { standard: 'Duhok', variants: ['Duhok', 'دهوك'] },
            { standard: 'Nasiriyah', variants: ['Nasiriyah', 'الناصرية'] }
        ]
    },
    MA: {
        name_ar: 'المغرب',
        name_en: 'Morocco',
        patterns: ['Morocco', 'المغرب', 'Maroc'],
        cities: [
            { standard: 'Casablanca', variants: ['Casablanca', 'الدار البيضاء'] },
            { standard: 'Rabat', variants: ['Rabat', 'الرباط'] },
            { standard: 'Marrakech', variants: ['Marrakech', 'Marrakesh', 'مراكش'] },
            { standard: 'Fez', variants: ['Fez', 'Fes', 'فاس'] },
            { standard: 'Tangier', variants: ['Tangier', 'Tanger', 'طنجة'] },
            { standard: 'Agadir', variants: ['Agadir', 'أكادير', 'اكادير'] },
            { standard: 'Meknes', variants: ['Meknes', 'Meknès', 'مكناس'] },
            { standard: 'Oujda', variants: ['Oujda', 'وجدة'] },
            { standard: 'Kenitra', variants: ['Kenitra', 'القنيطرة'] },
            { standard: 'Tetouan', variants: ['Tetouan', 'تطوان'] }
        ]
    },
    TN: {
        name_ar: 'تونس',
        name_en: 'Tunisia',
        patterns: ['Tunisia', 'تونس'],
        cities: [
            { standard: 'Tunis', variants: ['Tunis', 'تونس'] },
            { standard: 'Sfax', variants: ['Sfax', 'صفاقس'] },
            { standard: 'Sousse', variants: ['Sousse', 'سوسة'] },
            { standard: 'Kairouan', variants: ['Kairouan', 'القيروان'] },
            { standard: 'Bizerte', variants: ['Bizerte', 'بنزرت'] },
            { standard: 'Gabes', variants: ['Gabes', 'Gabès', 'قابس'] },
            { standard: 'Monastir', variants: ['Monastir', 'المنستير'] }
        ]
    },
    LY: {
        name_ar: 'ليبيا',
        name_en: 'Libya',
        patterns: ['Libya', 'ليبيا'],
        cities: [
            { standard: 'Tripoli', variants: ['Tripoli', 'طرابلس'] },
            { standard: 'Benghazi', variants: ['Benghazi', 'بنغازي'] },
            { standard: 'Misrata', variants: ['Misrata', 'Misurata', 'مصراتة', 'مصراته'] },
            { standard: 'Zawiya', variants: ['Zawiya', 'الزاوية'] },
            { standard: 'Zliten', variants: ['Zliten', 'زليتن'] },
            { standard: 'Sabha', variants: ['Sabha', 'سبها'] }
        ]
    },
    DZ: {
        name_ar: 'الجزائر',
        name_en: 'Algeria',
        patterns: ['Algeria', 'الجزائر', 'Algérie'],
        cities: [
            { standard: 'Algiers', variants: ['Algiers', 'Alger', 'الجزائر'] },
            { standard: 'Oran', variants: ['Oran', 'وهران'] },
            { standard: 'Constantine', variants: ['Constantine', 'قسنطينة'] },
            { standard: 'Annaba', variants: ['Annaba', 'عنابة'] },
            { standard: 'Batna', variants: ['Batna', 'باتنة'] },
            { standard: 'Blida', variants: ['Blida', 'البليدة'] },
            { standard: 'Setif', variants: ['Setif', 'Sétif', 'سطيف'] },
            { standard: 'Tlemcen', variants: ['Tlemcen', 'تلمسان'] },
            { standard: 'Bejaia', variants: ['Bejaia', 'Béjaïa', 'بجاية'] }
        ]
    },
    TR: {
        name_ar: 'تركيا',
        name_en: 'Turkey',
        patterns: ['Turkey', 'Türkiye', 'تركيا', 'Turkiye'],
        cities: [
            { standard: 'Istanbul', variants: ['Istanbul', 'İstanbul', 'إسطنبول', 'اسطنبول'] },
            { standard: 'Ankara', variants: ['Ankara', 'أنقرة', 'انقرة'] },
            { standard: 'Izmir', variants: ['Izmir', 'İzmir', 'إزمير', 'ازمير'] },
            { standard: 'Bursa', variants: ['Bursa', 'بورصة', 'بورصه'] },
            { standard: 'Antalya', variants: ['Antalya', 'أنطاليا', 'انطاليا'] },
            { standard: 'Adana', variants: ['Adana', 'أضنة', 'اضنه'] },
            { standard: 'Konya', variants: ['Konya', 'قونية', 'قونيا'] },
            { standard: 'Gaziantep', variants: ['Gaziantep', 'غازي عنتاب'] },
            { standard: 'Trabzon', variants: ['Trabzon', 'طرابزون'] },
            { standard: 'Mersin', variants: ['Mersin', 'مرسين'] },
            { standard: 'Kayseri', variants: ['Kayseri', 'قيصري'] },
            { standard: 'Eskisehir', variants: ['Eskisehir', 'Eskişehir', 'اسكي شهير'] }
        ]
    }
};

function buildCityLookup(countryCode) {
    const lookup = new Map();
    const country = CITIES_DATABASE[countryCode];
    if (!country) return lookup;
    country.cities.forEach(city => {
        city.variants.forEach(variant => {
            lookup.set(variant.toLowerCase(), city.standard);
        });
    });
    return lookup;
}

function extractCity(record, countryCode) {
    if (record.City && String(record.City).trim()) {
        const existing = String(record.City).trim();
        const normalized = normalizeCityName(existing, countryCode);
        if (normalized) return normalized;
        return existing;
    }

    const address = String(record.Address || '').trim();
    if (!address) return 'غير محدد';

    const country = CITIES_DATABASE[countryCode];
    if (!country) {
        return extractCityGeneric(address);
    }

    const addressLower = address.toLowerCase();

    const allVariants = [];
    country.cities.forEach(city => {
        city.variants.forEach(variant => {
            allVariants.push({ variant: variant, standard: city.standard });
        });
    });
    allVariants.sort((a, b) => b.variant.length - a.variant.length);

    for (const { variant, standard } of allVariants) {
        const variantLower = variant.toLowerCase();
        const index = addressLower.indexOf(variantLower);

        if (index !== -1) {
            const before = index > 0 ? addressLower[index - 1] : ' ';
            const after = index + variantLower.length < addressLower.length
                ? addressLower[index + variantLower.length]
                : ' ';

            const boundaryChars = ' ,،.\t\n-/()';
            if (boundaryChars.includes(before) || index === 0) {
                if (boundaryChars.includes(after) || (index + variantLower.length) === addressLower.length) {
                    return standard;
                }
            }
        }
    }

    const cityFromPattern = extractCityFromPattern(address);
    if (cityFromPattern) {
        const normalized = normalizeCityName(cityFromPattern, countryCode);
        if (normalized) return normalized;
        return cityFromPattern;
    }

    return 'غير محدد';
}

function normalizeCityName(name, countryCode) {
    const country = CITIES_DATABASE[countryCode];
    if (!country) return null;

    const nameLower = name.toLowerCase().trim();

    for (const city of country.cities) {
        for (const variant of city.variants) {
            if (variant.toLowerCase() === nameLower) {
                return city.standard;
            }
        }
    }

    return null;
}

function extractCityFromPattern(address) {
    const pattern1 = /,\s*([A-Za-z\s]+?)\s+\d{4,6}\s*,/;
    const match1 = address.match(pattern1);
    if (match1) return match1[1].trim();

    const pattern2 = /,\s*([A-Za-z\s]+?)\s*,\s*[A-Za-z\s]+$/;
    const match2 = address.match(pattern2);
    if (match2) {
        const candidate = match2[1].trim();
        const exclude = ['street', 'road', 'district', 'floor', 'building', 'st', 'rd', 'ave'];
        if (!exclude.includes(candidate.toLowerCase())) {
            return candidate;
        }
    }

    return null;
}

function extractCityGeneric(address) {
    const fromPattern = extractCityFromPattern(address);
    if (fromPattern) return fromPattern;
    return 'غير محدد';
}

function getCountryNameAr(countryCode) {
    if (countryCode === 'OTHER') return 'أخرى';
    const country = CITIES_DATABASE[countryCode];
    return country ? country.name_ar : countryCode;
}

function getCountryNameEn(countryCode) {
    if (countryCode === 'OTHER') return 'Other';
    const country = CITIES_DATABASE[countryCode];
    return country ? country.name_en : countryCode;
}

// ============================================
// Reverse Geocoding via Nominatim (OSM)
// ============================================

/**
 * طلب واحد لـ Nominatim reverse geocoding
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string|null>} اسم المدينة أو null
 */
async function reverseGeocodeCity(lat, lon) {
    var url = 'https://nominatim.openstreetmap.org/reverse'
        + '?lat=' + encodeURIComponent(lat)
        + '&lon=' + encodeURIComponent(lon)
        + '&format=json'
        + '&accept-language=en'
        + '&zoom=10'
        + '&addressdetails=1';

    try {
        var response = await fetch(url, {
            headers: {
                'User-Agent': 'DataMapPro/2.1 (https://ai8v.com)'
            }
        });

        if (!response.ok) return null;

        var data = await response.json();

        if (!data || !data.address) return null;

        // ترتيب أولوية الحقول: city ثم town ثم city_district ثم county ثم state
        var cityName = data.address.city
            || data.address.town
            || data.address.city_district
            || data.address.county
            || data.address.state
            || null;

        return cityName ? String(cityName).trim() : null;

    } catch (e) {
        console.warn('[ReverseGeocode] Failed for', lat, lon, e.message);
        return null;
    }
}

/**
 * معالجة دفعة سجلات بـ reverse geocoding مع throttling 1 طلب/ثانية
 * يُعدّل cityExtracted مباشرة في السجلات الممررة
 *
 * @param {Array} records — كل السجلات المعالجة
 * @param {string} countryCode — كود الدولة للتطبيع
 * @param {function} [onProgress] — callback(current, total)
 * @returns {Promise<{resolved: number, failed: number, total: number}>}
 */
async function reverseGeocodeBatch(records, countryCode, onProgress) {
    // جمع السجلات التي تحتاج geocoding
    var pending = [];
    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.cityExtracted === 'غير محدد') {
            var lat = parseFloat(r.Lat);
            var lon = parseFloat(r.Long);
            if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                pending.push({ index: i, lat: lat, lon: lon });
            }
        }
    }

    var result = { resolved: 0, failed: 0, total: pending.length };

    if (pending.length === 0) return result;

    for (var p = 0; p < pending.length; p++) {
        var item = pending[p];

        if (typeof onProgress === 'function') {
            try { onProgress(p + 1, pending.length); } catch (_) {}
        }

        try {
            var cityName = await reverseGeocodeCity(item.lat, item.lon);

            if (cityName) {
                // محاولة التطبيع مع قاعدة المدن المعروفة
                var normalized = normalizeCityName(cityName, countryCode);
                records[item.index].cityExtracted = normalized || cityName;
                result.resolved++;
            } else {
                result.failed++;
            }
        } catch (e) {
            result.failed++;
        }

        // throttling: انتظار 1.1 ثانية بين الطلبات (سياسة Nominatim: 1 طلب/ثانية)
        if (p < pending.length - 1) {
            await new Promise(function (resolve) { setTimeout(resolve, 1100); });
        }
    }

    return result;
}
