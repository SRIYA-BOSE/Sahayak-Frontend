const DB_NAME = 'SAHAYAK_DB'
const DB_VERSION = 1

const stores = {
  healthRecords: 'health_records',
  notifications: 'notifications',
  offlineData: 'offline_data',
  settings: 'settings',
}

let db = null

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Health records store
      if (!database.objectStoreNames.contains(stores.healthRecords)) {
        const healthStore = database.createObjectStore(stores.healthRecords, {
          keyPath: 'id',
          autoIncrement: true,
        })
        healthStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Notifications store
      if (!database.objectStoreNames.contains(stores.notifications)) {
        const notifStore = database.createObjectStore(stores.notifications, {
          keyPath: 'id',
          autoIncrement: true,
        })
        notifStore.createIndex('timestamp', 'timestamp', { unique: false })
        notifStore.createIndex('read', 'read', { unique: false })
      }

      // Offline data store
      if (!database.objectStoreNames.contains(stores.offlineData)) {
        database.createObjectStore(stores.offlineData, { keyPath: 'key' })
      }

      // Settings store
      if (!database.objectStoreNames.contains(stores.settings)) {
        database.createObjectStore(stores.settings, { keyPath: 'key' })
      }
    }
  })
}

export const saveHealthRecord = async (record) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.healthRecords], 'readwrite')
    const store = transaction.objectStore(stores.healthRecords)
    const request = store.add({
      ...record,
      timestamp: new Date().toISOString(),
      synced: false,
    })

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getHealthRecords = async (startDate, endDate) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.healthRecords], 'readonly')
    const store = transaction.objectStore(stores.healthRecords)
    const index = store.index('timestamp')
    const range = IDBKeyRange.bound(startDate, endDate)
    const request = index.getAll(range)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const saveNotification = async (notification) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.notifications], 'readwrite')
    const store = transaction.objectStore(stores.notifications)
    const request = store.add({
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    })

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getNotifications = async (limit = 50) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.notifications], 'readonly')
    const store = transaction.objectStore(stores.notifications)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev')

    const results = []
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor && results.length < limit) {
        results.push(cursor.value)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export const markNotificationAsRead = async (id) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.notifications], 'readwrite')
    const store = transaction.objectStore(stores.notifications)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const data = getRequest.result
      if (data) {
        data.read = true
        const updateRequest = store.put(data)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

export const saveOfflineData = async (key, data) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.offlineData], 'readwrite')
    const store = transaction.objectStore(stores.offlineData)
    const request = store.put({ key, data, timestamp: new Date().toISOString() })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getOfflineData = async (key) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.offlineData], 'readonly')
    const store = transaction.objectStore(stores.offlineData)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result ? request.result.data : null)
    }
    request.onerror = () => reject(request.error)
  })
}

export const saveSetting = async (key, value) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.settings], 'readwrite')
    const store = transaction.objectStore(stores.settings)
    const request = store.put({ key, value, timestamp: new Date().toISOString() })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getSetting = async (key) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([stores.settings], 'readonly')
    const store = transaction.objectStore(stores.settings)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result ? request.result.value : null)
    }
    request.onerror = () => reject(request.error)
  })
}

