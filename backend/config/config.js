require('dotenv').config();

module.exports = {

  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',

    pool: {
      max: 3,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },

    logging: false
  },

  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',

    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },

    logging: false
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',

    pool: {
      max: 3,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },

    logging: false
  }

};