import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

// Middleware đảm nhiệm việc xác thực token gửi lên từ client có hợp lệ hay không
const isAuthorized = async (req, res, next) => {
  // Lấy accessToken từ cookie
  const clientAccessToken = req.cookies?.accessToken

  // Nếu accessToken không có thì trả về lỗi
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized (token not found)'))
    return
  }

  try {
    // B1: Thực hiện giải mã token có hợp lệ hay không
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    // B2: Nếu token hợp lệ thì cần phải lưu thông tin giải mã được vào cái req.jwtDecoded, để sử dụng cho các tầng phía sau
    req.jwtDecoded = accessTokenDecoded
    // B3: Cho phép user request đi tiếp
    next()
  } catch (error) {
    // Nếu accessToken hết hạn thì trả về lỗi GONE - 410 cho phía FE gọi api refresh token
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
      return
    }
    // Nếu accessToken không hợp lệ khác hết hạn thì trả về lỗi cho phía FE gọi api sign_out
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }
}

export const authMiddleware = {
  isAuthorized
}