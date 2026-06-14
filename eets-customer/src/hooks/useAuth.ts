import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { userApi } from '../api/user.api'
import { useAuthStore } from '../store/auth.store'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, accessToken, setUser, setTokens, logout } = useAuthStore()

  const useProfile = (enabled = !!accessToken) =>
    useQuery({
      queryKey: ['profile'],
      queryFn: async () => {
        const profileUser = await userApi.getMe()
        setUser(profileUser)
        return profileUser
      },
      enabled,
    })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.user)
      toast.success('Welcome back!')
      navigate('/')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Login failed')
    },
  })

  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.user)
      toast.success('Logged in with Google')
      navigate('/')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Google login failed')
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (_, variables) => {
      toast.success('Registration successful! Verification OTP sent.')
      navigate(`/otp-verify?phone=${encodeURIComponent(variables.phone)}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed')
    },
  })

  const sendOtpMutation = useMutation({
    mutationFn: authApi.sendOtp,
    onSuccess: () => {
      toast.success('OTP sent successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.user)
      toast.success('OTP Verified. Welcome!')
      navigate('/')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'OTP Verification failed')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout()
      queryClient.clear()
      toast.success('Logged out successfully')
      navigate('/login')
    },
    onError: () => {
      // Still logout locally if network logout fails
      logout()
      queryClient.clear()
      navigate('/login')
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to request reset link')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully. Please login.')
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (updatedUser, variables: any) => {
      setUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      const message = variables?.toastMessage || 'Profile updated successfully'
      toast.success(message)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    },
  })

  return {
    user,
    isAuthenticated: !!accessToken,
    useProfile,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    googleLogin: googleLoginMutation.mutate,
    isGoogleLoggingIn: googleLoginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    sendOtp: sendOtpMutation.mutate,
    isSendingOtp: sendOtpMutation.isPending,
    verifyOtp: verifyOtpMutation.mutate,
    isVerifyingOtp: verifyOtpMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    isRequestingReset: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  }
}
export default useAuth
