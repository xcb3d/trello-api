import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from './environment'

let trelloDatabaseInstance = null

const clientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

//Kết nối tới database
export const CONNECT_DB = async () => {
  //Gọi kết nối tới MongoDB atlas
  await clientInstance.connect()
  //Lấy dữ liệu từ database
  trelloDatabaseInstance = clientInstance.db(env.DATABASE_NAME)
}

//Đóng kết nối tới database
export const CLOSE_DB = async () => {
  await clientInstance.close()
}

//Export database khi connect thành công
export const GET_DB = () => {
  if (!trelloDatabaseInstance) {
    throw new Error('Database not connected')
  }
  return trelloDatabaseInstance
}
