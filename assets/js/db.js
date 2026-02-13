const DB_NAME = 'DataMapPro';
const DB_VERSION = 2;
const STORE_RECORDS = 'records';
const STORE_IMPORTS = 'imports';
const DB_TIMEOUT = 30000;
let _db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        if (_db) {
            resolve(_db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const database = event.target.result;
            const oldVersion = event.oldVersion;

            if (oldVersion < 1) {
                if (!database.objectStoreNames.contains(STORE_RECORDS)) {
                    const recordStore = database.createObjectStore(STORE_RECORDS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    recordStore.createIndex('phone', 'Phone', { unique: false });
                    recordStore.createIndex('city', 'cityExtracted', { unique: false });
                    recordStore.createIndex('category', 'Category', { unique: false });
                    recordStore.createIndex('keyword', 'keyword', { unique: false });
                    recordStore.createIndex('name', 'Name', { unique: false });
                    recordStore.createIndex('isDuplicate', 'isDuplicate', { unique: false });
                }

                if (!database.objectStoreNames.contains(STORE_IMPORTS)) {
                    const importStore = database.createObjectStore(STORE_IMPORTS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    importStore.createIndex('date', 'date', { unique: false });
                    importStore.createIndex('keyword', 'keyword', { unique: false });
                }
            }

            if (oldVersion < 2) {
                const tx = event.target.transaction;
                const recordStore = tx.objectStore(STORE_RECORDS);

                if (!recordStore.indexNames.contains('rating')) {
                    recordStore.createIndex('rating', 'Rating', { unique: false });
                }
                if (!recordStore.indexNames.contains('reviews')) {
                    recordStore.createIndex('reviews', 'Reviews', { unique: false });
                }
            }
        };

        request.onsuccess = function (event) {
            _db = event.target.result;
            _db.onerror = function (e) {
                console.error('Database error:', e.target.error);
            };
            resolve(_db);
        };

        request.onerror = function (event) {
            console.error('Failed to open database:', event.target.error);
            reject(event.target.error);
        };
    });
}

function withTimeout(promise, ms = DB_TIMEOUT, operationName = 'عملية قاعدة البيانات') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`انتهت المهلة الزمنية لـ ${operationName} (${Math.round(ms / 1000)} ثانية)`));
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
}

const DB = {

    async getAll() {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'جلب كل السجلات');
    },

    async getById(id) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'جلب سجل');
    },

    async add(record) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readwrite');
            const store = tx.objectStore(STORE_RECORDS);
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'إضافة سجل');
    },

    async addBulk(records, batchSize = 200, onProgress) {
        if (!records || records.length === 0) {
            return { added: 0, failed: 0, errors: [] };
        }

        const database = await initDB();
        let totalAdded = 0;
        let totalFailed = 0;
        const errors = [];
        const totalBatches = Math.ceil(records.length / batchSize);

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;

            if (typeof onProgress === 'function') {
                try { onProgress(batchNum, totalBatches); } catch (_) {}
            }

            try {
                const batchResult = await withTimeout(new Promise((resolve, reject) => {
                    const tx = database.transaction(STORE_RECORDS, 'readwrite');
                    const store = tx.objectStore(STORE_RECORDS);
                    let count = 0;
                    let batchErrors = [];

                    batch.forEach((record, idx) => {
                        const cleanRecord = { ...record };
                        delete cleanRecord.id;

                        try {
                            const req = store.add(cleanRecord);
                            req.onsuccess = () => count++;
                            req.onerror = (e) => {
                                e.preventDefault();
                                batchErrors.push({
                                    index: i + idx,
                                    name: cleanRecord.Name || 'غير معروف',
                                    error: e.target.error ? e.target.error.message : 'خطأ غير معروف'
                                });
                            };
                        } catch (addError) {
                            batchErrors.push({
                                index: i + idx,
                                name: cleanRecord.Name || 'غير معروف',
                                error: addError.message
                            });
                        }
                    });

                    tx.oncomplete = () => resolve({ count, errors: batchErrors });
                    tx.onerror = (e) => {
                        reject(new Error(`فشلت الدفعة ${batchNum}: ${e.target.error ? e.target.error.message : 'خطأ غير معروف'}`));
                    };
                    tx.onabort = (e) => {
                        reject(new Error(`أُلغيت الدفعة ${batchNum}: ${tx.error ? tx.error.message : 'خطأ غير معروف'}`));
                    };
                }), DB_TIMEOUT, `إضافة الدفعة ${batchNum}`);

                totalAdded += batchResult.count;
                totalFailed += batchResult.errors.length;
                errors.push(...batchResult.errors);

            } catch (batchError) {
                totalFailed += batch.length;
                errors.push({
                    index: i,
                    name: `الدفعة ${batchNum} (${batch.length} سجل)`,
                    error: batchError.message
                });
            }
        }

        return { added: totalAdded, failed: totalFailed, errors };
    },

    async update(record) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readwrite');
            const store = tx.objectStore(STORE_RECORDS);
            const request = store.put(record);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'تحديث سجل');
    },

    async delete(id) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readwrite');
            const store = tx.objectStore(STORE_RECORDS);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'حذف سجل');
    },

    async deleteBulk(ids) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readwrite');
            const store = tx.objectStore(STORE_RECORDS);
            let count = 0;

            ids.forEach(id => {
                const req = store.delete(id);
                req.onsuccess = () => count++;
            });

            tx.oncomplete = () => resolve(count);
            tx.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'حذف مجموعة سجلات');
    },

    async count() {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'عد السجلات');
    },

    async getPage(filters = {}, sortBy = 'name', page = 1, limit = 25) {
        const database = await initDB();
        const hasSearch = !!(filters.search && filters.search.trim());

        if (hasSearch) {
            return this._getPageFullScan(database, filters, sortBy, page, limit);
        }

        return this._getPageOptimized(database, filters, sortBy, page, limit);
    },

    async _getPageFullScan(database, filters, sortBy, page, limit) {
        const indexFilter = _pickBestIndex(filters);

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);
            const matched = [];
            let source;

            if (indexFilter) {
                const index = store.index(indexFilter.indexName);
                source = index.openCursor(IDBKeyRange.only(indexFilter.value));
            } else {
                source = store.openCursor();
            }

            source.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (_matchesAllFilters(cursor.value, filters)) {
                        matched.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    _sortRecords(matched, sortBy);
                    const totalFiltered = matched.length;
                    const start = (page - 1) * limit;
                    resolve({ records: matched.slice(start, start + limit), totalFiltered });
                }
            };

            source.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'جلب صفحة بيانات (بحث)');
    },

    async _getPageOptimized(database, filters, sortBy, page, limit) {
        var sortableIndexes = {
            'name': 'name',
            'city': 'city',
            'category': 'category',
            'keyword': 'keyword',
            'rating': 'rating',
            'reviews': 'reviews'
        };

        if (!sortableIndexes[sortBy]) {
            return this._getPageFullScan(database, filters, sortBy, page, limit);
        }

        var sortIndexName = sortableIndexes[sortBy];
        var filterIndex = _pickBestIndex(filters);

        if (!filterIndex) {
            return this._getPageSortedCursor(database, filters, sortBy, sortIndexName, null, page, limit);
        }

        if (filterIndex.indexName === sortIndexName) {
            return this._getPageSortedCursor(database, filters, sortBy, sortIndexName, filterIndex, page, limit);
        }

        var totalFiltered = await this.countFiltered(filters);

        if (totalFiltered === 0) {
            return { records: [], totalFiltered: 0 };
        }

        return withTimeout(new Promise(function (resolve, reject) {
            var tx = database.transaction(STORE_RECORDS, 'readonly');
            var store = tx.objectStore(STORE_RECORDS);
            var matched = [];

            var index = store.index(filterIndex.indexName);
            var source = index.openCursor(IDBKeyRange.only(filterIndex.value));

            source.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (_matchesAllFilters(cursor.value, filters)) {
                        matched.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    _sortRecords(matched, sortBy);
                    var start = (page - 1) * limit;
                    resolve({
                        records: matched.slice(start, start + limit),
                        totalFiltered: totalFiltered
                    });
                }
            };

            source.onerror = function (e) { reject(e.target.error); };
        }), DB_TIMEOUT, 'جلب صفحة بيانات (فلتر+ترتيب)');
    },

    async _getPageSortedCursor(database, filters, sortBy, sortIndexName, filterIndex, page, limit) {
        var totalFiltered = await this.countFiltered(filters);

        if (totalFiltered === 0) {
            return { records: [], totalFiltered: 0 };
        }

        var skip = (page - 1) * limit;

        return withTimeout(new Promise(function (resolve, reject) {
            var tx = database.transaction(STORE_RECORDS, 'readonly');
            var store = tx.objectStore(STORE_RECORDS);
            var pageRecords = [];
            var skipped = 0;
            var collected = 0;
            var source;

            var index = store.index(sortIndexName);
            if (filterIndex) {
                source = index.openCursor(IDBKeyRange.only(filterIndex.value));
            } else {
                source = index.openCursor();
            }

            source.onsuccess = function (event) {
                var cursor = event.target.result;
                if (!cursor || collected >= limit) {
                    resolve({ records: pageRecords, totalFiltered: totalFiltered });
                    return;
                }

                var record = cursor.value;

                if (!_matchesAllFilters(record, filters)) {
                    cursor.continue();
                    return;
                }

                if (skipped < skip) {
                    skipped++;
                    cursor.continue();
                    return;
                }

                pageRecords.push(record);
                collected++;

                if (collected >= limit) {
                    resolve({ records: pageRecords, totalFiltered: totalFiltered });
                    return;
                }

                cursor.continue();
            };

            source.onerror = function (e) { reject(e.target.error); };
        }), DB_TIMEOUT, 'جلب صفحة بيانات (محسّن)');
    },

    async countFiltered(filters = {}) {
        if (!filters.search && !filters.city && !filters.category && !filters.keyword
            && !filters.hasPhone && !filters.hasWebsite && !filters.reviewsRange) {
            return this.count();
        }

        const database = await initDB();
        const indexFilter = _pickBestIndex(filters);

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);
            let count = 0;
            let source;

            if (indexFilter) {
                const index = store.index(indexFilter.indexName);
                const keyRange = IDBKeyRange.only(indexFilter.value);
                source = index.openCursor(keyRange);
            } else {
                source = store.openCursor();
            }

            source.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (_matchesAllFilters(cursor.value, filters)) {
                        count++;
                    }
                    cursor.continue();
                } else {
                    resolve(count);
                }
            };

            source.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'عد السجلات المفلترة');
    },

    async getStatsCursor() {
        const database = await initDB();

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);

            const cities = new Set();
            const categories = new Set();
            const keywords = new Set();
            let totalRecords = 0;
            let totalRating = 0;
            let ratingCount = 0;
            let totalReviews = 0;

            const cursor = store.openCursor();

            cursor.onsuccess = function (event) {
                const c = event.target.result;
                if (c) {
                    const r = c.value;
                    totalRecords++;
                    if (r.cityExtracted) cities.add(r.cityExtracted);
                    if (r.Category) categories.add(r.Category);
                    if (r.keyword) keywords.add(r.keyword);

                    const rating = parseFloat(r.Rating);
                    if (!isNaN(rating) && rating > 0) {
                        totalRating += rating;
                        ratingCount++;
                    }

                    const reviews = parseInt(r.Reviews);
                    if (!isNaN(reviews)) totalReviews += reviews;

                    c.continue();
                } else {
                    resolve({
                        totalRecords,
                        totalCities: cities.size,
                        totalCategories: categories.size,
                        totalKeywords: keywords.size,
                        avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0',
                        totalReviews,
                        cities: Array.from(cities).sort(),
                        categories: Array.from(categories).sort(),
                        keywords: Array.from(keywords).sort()
                    });
                }
            };

            cursor.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'حساب الإحصائيات');
    },

    async buildDuplicateMaps() {
        const database = await initDB();

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);

            const cidMap = new Map();
            const phoneMap = new Map();
            const nameCityMap = new Map();

            const cursor = store.openCursor();

            cursor.onsuccess = function (event) {
                const c = event.target.result;
                if (c) {
                    const record = c.value;

                    const cid = _cleanVal(record['Listing CID']);
                    if (cid) cidMap.set(cid, record);

                    const phone = _cleanPhone(record.Phone);
                    if (phone) phoneMap.set(phone, record);

                    const nameCity = `${_cleanVal(record.Name)}|||${_cleanVal(record.cityExtracted)}`.toLowerCase();
                    if (record.Name) nameCityMap.set(nameCity, record);

                    c.continue();
                } else {
                    resolve({ cidMap, phoneMap, nameCityMap });
                }
            };

            cursor.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'بناء خرائط التكرار');
    },

    async findDuplicates(newRecords) {
        const { cidMap, phoneMap, nameCityMap } = await this.buildDuplicateMaps();

        const duplicates = [];
        const unique = [];

        newRecords.forEach(newRecord => {
            let matchedWith = null;
            let matchType = '';

            const newCid = _cleanVal(newRecord['Listing CID']);
            if (newCid && cidMap.has(newCid)) {
                matchedWith = cidMap.get(newCid);
                matchType = 'Listing CID';
            }

            if (!matchedWith) {
                const newPhone = _cleanPhone(newRecord.Phone);
                if (newPhone && phoneMap.has(newPhone)) {
                    matchedWith = phoneMap.get(newPhone);
                    matchType = 'الهاتف';
                }
            }

            if (!matchedWith) {
                const newNameCity = `${_cleanVal(newRecord.Name)}|||${_cleanVal(newRecord.cityExtracted)}`.toLowerCase();
                if (newRecord.Name && nameCityMap.has(newNameCity)) {
                    matchedWith = nameCityMap.get(newNameCity);
                    matchType = 'الاسم + المدينة';
                }
            }

            if (matchedWith) {
                duplicates.push({ newRecord, existingRecord: matchedWith, matchType });
            } else {
                unique.push(newRecord);

                const cid = _cleanVal(newRecord['Listing CID']);
                if (cid) cidMap.set(cid, newRecord);

                const phone = _cleanPhone(newRecord.Phone);
                if (phone) phoneMap.set(phone, newRecord);

                const nameCity = `${_cleanVal(newRecord.Name)}|||${_cleanVal(newRecord.cityExtracted)}`.toLowerCase();
                if (newRecord.Name) nameCityMap.set(nameCity, newRecord);
            }
        });

        return { duplicates, unique };
    },

    async buildExportRows(columns, filters = {}, onProgress) {
        const database = await initDB();
        const indexFilter = _pickBestIndex(filters);
        const hasFilters = !!(filters.city || filters.category || filters.keyword || filters.hasPhone || filters.hasWebsite || filters.reviewsRange);
        const PROGRESS_INTERVAL = 500;

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);
            const rows = [];
            let totalCount = 0;
            let source;

            if (hasFilters && indexFilter) {
                const index = store.index(indexFilter.indexName);
                source = index.openCursor(IDBKeyRange.only(indexFilter.value));
            } else {
                source = store.openCursor();
            }

            source.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const record = cursor.value;

                    if (hasFilters && !_matchesAllFilters(record, filters)) {
                        cursor.continue();
                        return;
                    }

                    const row = new Array(columns.length);
                    for (let i = 0; i < columns.length; i++) {
                        const val = record[columns[i]];
                        row[i] = (val === undefined || val === null) ? '' : String(val);
                    }
                    rows.push(row);
                    totalCount++;

                    if (typeof onProgress === 'function' && totalCount % PROGRESS_INTERVAL === 0) {
                        try { onProgress(totalCount); } catch (_) {}
                    }

                    cursor.continue();
                } else {
                    if (typeof onProgress === 'function') {
                        try { onProgress(totalCount); } catch (_) {}
                    }
                    resolve({ rows, totalCount });
                }
            };

            source.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT * 2, 'بناء صفوف التصدير');
    },

    async getFilteredOptions(filters = {}) {
        const database = await initDB();
        const indexFilter = _pickBestIndex(filters);

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);

            const cities = new Set();
            const categories = new Set();
            const keywords = new Set();
            let source;

            if (indexFilter) {
                const index = store.index(indexFilter.indexName);
                source = index.openCursor(IDBKeyRange.only(indexFilter.value));
            } else {
                source = store.openCursor();
            }

            source.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const r = cursor.value;

                    if (_matchesAllFilters(r, filters)) {
                        if (r.cityExtracted) cities.add(r.cityExtracted);
                        if (r.Category) categories.add(r.Category);
                        if (r.keyword) keywords.add(r.keyword);
                    }

                    cursor.continue();
                } else {
                    resolve({
                        cities: Array.from(cities).sort(),
                        categories: Array.from(categories).sort(),
                        keywords: Array.from(keywords).sort()
                    });
                }
            };

            source.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'جلب خيارات الفلاتر');
    },

    async addImport(importData) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_IMPORTS, 'readwrite');
            const store = tx.objectStore(STORE_IMPORTS);
            const request = store.add(importData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'حفظ سجل الاستيراد');
    },

    async getAllImports() {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_IMPORTS, 'readonly');
            const store = tx.objectStore(STORE_IMPORTS);
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result.sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );
                resolve(results);
            };
            request.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'جلب سجل الاستيرادات');
    },

    async addBulkImports(imports) {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_IMPORTS, 'readwrite');
            const store = tx.objectStore(STORE_IMPORTS);
            let count = 0;

            imports.forEach(imp => {
                const cleanImp = { ...imp };
                delete cleanImp.id;
                const req = store.add(cleanImp);
                req.onsuccess = () => count++;
            });

            tx.oncomplete = () => resolve(count);
            tx.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'استيراد سجلات');
    },

    async clearAll() {
        const database = await initDB();
        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction([STORE_RECORDS, STORE_IMPORTS], 'readwrite');
            tx.objectStore(STORE_RECORDS).clear();
            tx.objectStore(STORE_IMPORTS).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'مسح البيانات');
    },

    async safeRestore(backupData) {
        let previousRecords = [];
        let previousImports = [];

        try {
            previousRecords = await this.getAll();
            previousImports = await this.getAllImports();
        } catch (backupError) {
            console.warn('Could not backup current data before restore:', backupError);
        }

        try {
            await this.clearAll();
        } catch (clearError) {
            return {
                success: false,
                recordsRestored: 0,
                importsRestored: 0,
                error: 'فشل في مسح البيانات الحالية: ' + clearError.message
            };
        }

        let recordsRestored = 0;
        let importsRestored = 0;

        try {
            if (backupData.records && backupData.records.length > 0) {
                const result = await this.addBulk(backupData.records);
                recordsRestored = result.added;

                if (result.failed > 0) {
                    console.warn(`Restore: ${result.failed} records failed to restore`);
                }
            }

            if (backupData.imports && backupData.imports.length > 0) {
                importsRestored = await this.addBulkImports(backupData.imports);
            }

            return {
                success: true,
                recordsRestored,
                importsRestored,
                error: null
            };

        } catch (restoreError) {
            console.error('Restore failed, attempting rollback:', restoreError);

            try {
                await this.clearAll();

                if (previousRecords.length > 0) {
                    await this.addBulk(previousRecords);
                }
                if (previousImports.length > 0) {
                    await this.addBulkImports(previousImports);
                }

                return {
                    success: false,
                    recordsRestored: 0,
                    importsRestored: 0,
                    error: 'فشلت الاستعادة وتم إرجاع البيانات السابقة: ' + restoreError.message
                };
            } catch (rollbackError) {
                return {
                    success: false,
                    recordsRestored: 0,
                    importsRestored: 0,
                    error: 'فشلت الاستعادة وفشل الإرجاع. يُرجى استيراد النسخة الاحتياطية يدوياً: ' + rollbackError.message
                };
            }
        }
    },

    async getAnalyticsData(onProgress) {
        const database = await initDB();
        const PROGRESS_INTERVAL = 500;

        return withTimeout(new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_RECORDS, 'readonly');
            const store = tx.objectStore(STORE_RECORDS);

            let totalRecords = 0;
            let totalRating = 0;
            let ratingCount = 0;

            const allKeywords = new Set();
            const allCities = new Set();
            const allCategories = new Set();

            const cellMap = {};
            const kwStats = {};

            const cursor = store.openCursor();

            cursor.onsuccess = function (event) {
                const c = event.target.result;
                if (c) {
                    const r = c.value;
                    totalRecords++;

                    const keyword = r.keyword || '';
                    const city = r.cityExtracted || 'غير محدد';
                    const category = r.Category || 'غير مصنف';
                    const rating = parseFloat(r.Rating);
                    const hasRating = !isNaN(rating) && rating > 0;
                    const hasWebsite = r.Website && String(r.Website).trim() !== '';

                    if (keyword) allKeywords.add(keyword);
                    allCities.add(city);
                    allCategories.add(category);

                    if (hasRating) {
                        totalRating += rating;
                        ratingCount++;
                    }

                    const cellKey = keyword + '|||' + city;
                    if (!cellMap[cellKey]) {
                        cellMap[cellKey] = {
                            keyword,
                            city,
                            count: 0,
                            ratingSum: 0,
                            ratingCount: 0,
                            noWebsite: 0,
                            lowRated: 0,
                            categories: {},
                            ratingBuckets: [0, 0, 0, 0, 0, 0]
                        };
                    }
                    const cell = cellMap[cellKey];
                    cell.count++;

                    if (hasRating) {
                        cell.ratingSum += rating;
                        cell.ratingCount++;
                        if (rating < 3.5) cell.lowRated++;

                        if (rating >= 4.5) cell.ratingBuckets[0]++;
                        else if (rating >= 4) cell.ratingBuckets[1]++;
                        else if (rating >= 3) cell.ratingBuckets[2]++;
                        else if (rating >= 2) cell.ratingBuckets[3]++;
                        else cell.ratingBuckets[4]++;
                    } else {
                        cell.ratingBuckets[5]++;
                    }

                    if (!hasWebsite) cell.noWebsite++;

                    cell.categories[category] = (cell.categories[category] || 0) + 1;

                    if (keyword) {
                        if (!kwStats[keyword]) {
                            kwStats[keyword] = { count: 0, cities: new Set(), ratingSum: 0, ratingCount: 0 };
                        }
                        const kw = kwStats[keyword];
                        kw.count++;
                        kw.cities.add(city);
                        if (hasRating) {
                            kw.ratingSum += rating;
                            kw.ratingCount++;
                        }
                    }

                    if (typeof onProgress === 'function' && totalRecords % PROGRESS_INTERVAL === 0) {
                        try { onProgress(totalRecords); } catch (_) {}
                    }

                    c.continue();
                } else {
                    if (typeof onProgress === 'function') {
                        try { onProgress(totalRecords); } catch (_) {}
                    }

                    const keywordComparison = {};
                    for (const kw in kwStats) {
                        const s = kwStats[kw];
                        keywordComparison[kw] = {
                            count: s.count,
                            cityCount: s.cities.size,
                            avgRating: s.ratingCount > 0
                                ? (s.ratingSum / s.ratingCount).toFixed(1)
                                : '-'
                        };
                    }

                    resolve({
                        totalRecords,
                        avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0',
                        keywords: Array.from(allKeywords).sort(),
                        cities: Array.from(allCities).sort(),
                        categories: Array.from(allCategories).sort(),
                        cellMap,
                        keywordComparison
                    });
                }
            };

            cursor.onerror = (e) => reject(e.target.error);
        }), DB_TIMEOUT, 'تجميع بيانات التحليلات');
    },

    async getStats() {
        return this.getStatsCursor();
    },

    async exportBackup() {
        const records = await this.getAll();
        const imports = await this.getAllImports();

        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            app: 'DataMap Pro',
            data: { records, imports },
            summary: {
                totalRecords: records.length,
                totalImports: imports.length
            }
        };
    }
};

function _cleanVal(val) {
    if (!val) return '';
    return String(val).trim();
}

function _cleanPhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/[\s\-\(\)\+\.]/g, '').trim();
}

function _pickBestIndex(filters) {
    if (filters.keyword) {
        if (Array.isArray(filters.keyword)) {
            if (filters.keyword.length === 1) return { indexName: 'keyword', value: filters.keyword[0] };
        } else {
            return { indexName: 'keyword', value: filters.keyword };
        }
    }
    if (filters.city) {
        if (Array.isArray(filters.city)) {
            if (filters.city.length === 1) return { indexName: 'city', value: filters.city[0] };
        } else {
            return { indexName: 'city', value: filters.city };
        }
    }
    if (filters.category) {
        if (Array.isArray(filters.category)) {
            if (filters.category.length === 1) return { indexName: 'category', value: filters.category[0] };
        } else {
            return { indexName: 'category', value: filters.category };
        }
    }
    return null;
}

function _matchesAllFilters(record, filters) {
    if (filters.search) {
        var query = filters.search.toLowerCase();
        var searchable = [record.Name, record.Address, record.Phone, record.Category, record.cityExtracted];
        var found = searchable.some(function (field) {
            return field && String(field).toLowerCase().includes(query);
        });
        if (!found) return false;
    }
    if (filters.city) {
        if (Array.isArray(filters.city)) {
            if (filters.city.length > 0 && filters.city.indexOf(record.cityExtracted) === -1) return false;
        } else {
            if (record.cityExtracted !== filters.city) return false;
        }
    }
    if (filters.category) {
        if (Array.isArray(filters.category)) {
            if (filters.category.length > 0 && filters.category.indexOf(record.Category) === -1) return false;
        } else {
            if (record.Category !== filters.category) return false;
        }
    }
    if (filters.keyword) {
        if (Array.isArray(filters.keyword)) {
            if (filters.keyword.length > 0 && filters.keyword.indexOf(record.keyword) === -1) return false;
        } else {
            if (record.keyword !== filters.keyword) return false;
        }
    }

    if (filters.hasPhone) {
        var phone = record.Phone ? String(record.Phone).replace(/[\s\-\(\)\+\.]/g, '').trim() : '';
        var phoneExists = phone.length >= 3;
        if (filters.hasPhone === 'yes' && !phoneExists) return false;
        if (filters.hasPhone === 'no' && phoneExists) return false;
    }

    if (filters.hasWebsite) {
        var website = record.Website ? String(record.Website).trim() : '';
        var websiteExists = website.length > 0;
        if (filters.hasWebsite === 'yes' && !websiteExists) return false;
        if (filters.hasWebsite === 'no' && websiteExists) return false;
    }

    if (filters.reviewsRange) {
        var reviews = parseInt(record.Reviews) || 0;
        if (filters.reviewsRange === '0' && reviews !== 0) return false;
        if (filters.reviewsRange === 'lt10' && reviews >= 10) return false;
        if (filters.reviewsRange === 'gte10' && reviews < 10) return false;
        if (filters.reviewsRange === 'gte50' && reviews < 50) return false;
    }

    return true;
}

function _sortRecords(records, sortBy) {
    records.sort((a, b) => {
        switch (sortBy) {
            case 'name': return (a.Name || '').localeCompare(b.Name || '', 'ar');
            case 'rating': return (b.Rating || 0) - (a.Rating || 0);
            case 'reviews': return (b.Reviews || 0) - (a.Reviews || 0);
            case 'city': return (a.cityExtracted || '').localeCompare(b.cityExtracted || '', 'ar');
            case 'keyword': return (a.keyword || '').localeCompare(b.keyword || '', 'ar');
            default: return 0;
        }
    });
}
