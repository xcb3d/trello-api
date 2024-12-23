import JWT from 'jsonwebtoken'

// Function tạo mới token - Cần 3 tham số đầu vào
// userInfo: Thông tin muốn đính kèm token
// secretSignature: Private key
// tokenLive: Thời gian sống của token
const generateToken = async (userInfo, secretSignature, tokenLive) => {
  try {
    return JWT.sign(userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLive })
  } catch (error) {
    throw new Error(error)
  }
}

// Kiểm tra token có hợp lệ hay không
// Token được hợp lệ nếu được tạo ra đúng với secretSignature 
const verifyToken = async (token, secretSignature) => {
  try {
    return JWT.verify(token, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}