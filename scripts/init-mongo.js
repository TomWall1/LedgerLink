// MongoDB Initialization Script for Docker
// Creates initial database structure and indexes

// Switch to the ledgerlink database
db = db.getSiblingDB('ledgerlink');

// Create a user for the application
db.createUser({
  user: 'ledgerlink',
  pwd: 'ledgerlink_password',
  roles: [
    {
      role: 'readWrite',
      db: 'ledgerlink'
    }
  ]
});

console.log('Database user created successfully');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address'
        },
        name: {
          bsonType: 'string',
          description: 'must be a string if provided'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date if provided'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date if provided'
        }
      }
    }
  }
});

db.createCollection('companies', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'ownerId'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        ownerId: {
          bsonType: 'objectId',
          description: 'must be an ObjectId and is required'
        }
      }
    }
  }
});

db.createCollection('xeroconnections', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'companyId', 'tenantId', 'tenantName'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'must be an ObjectId and is required'
        },
        companyId: {
          bsonType: 'objectId',
          description: 'must be an ObjectId and is required'
        },
        tenantId: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        tenantName: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'expired', 'revoked', 'error'],
          description: 'must be one of the enum values'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

console.log('Collections created with validation rules');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.companies.createIndex({ ownerId: 1 });
db.companies.createIndex({ name: 1, ownerId: 1 });

db.xeroconnections.createIndex({ userId: 1, companyId: 1 });
db.xeroconnections.createIndex({ tenantId: 1 }, { unique: true });
db.xeroconnections.createIndex({ status: 1, expiresAt: 1 });
db.xeroconnections.createIndex({ lastSyncAt: -1 });

console.log('Indexes created successfully');

// Insert sample data for development
if (db.getName() === 'ledgerlink') {
  // Create a sample user
  const sampleUser = {
    _id: ObjectId(),
    email: 'demo@ledgerlink.com',
    name: 'Demo User',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.users.insertOne(sampleUser);
  
  // Create a sample company
  const sampleCompany = {
    _id: ObjectId(),
    name: 'Demo Company',
    ownerId: sampleUser._id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.companies.insertOne(sampleCompany);
  
  console.log('Sample data inserted for development');
}

console.log('MongoDB initialization complete');