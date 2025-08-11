import { NextResponse } from 'next/server'
import axios from 'axios'
import type { AxiosError } from 'axios'

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    role: string;
  };
  token?: string;
  error?: string;
}

interface BackendUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

interface BackendResponse {
  user: BackendUser;
  token: string;
}

interface BackendErrorResponse {
  message: string;
  status?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Docker Compose için backend URL - container adı ile
    const backendUrl = process.env.BACKEND_URL || 'http://backend:3001';
    
    try {
      console.log(`Attempting to login with email: ${email}`);
      
      // Direct request to backend with absolute URL
      const response = await axios.post<BackendResponse>(`${backendUrl}/auth/login`, {
        email,
        password
      });

      console.log('Backend login response:', response.data);

      // User bilgilerini doğru formatta map'le
      const userData = {
        id: response.data.user.id,
        name: response.data.user.firstName 
          ? `${response.data.user.firstName} ${response.data.user.lastName || ''}`
          : response.data.user.username,
        email: response.data.user.email,
        companyName: response.data.user.company || '',
        role: 'developer' // Backend'den gelmiyorsa varsayılan değer
      };

      // Backend'den başarılı yanıt alındı
      return NextResponse.json<LoginResponse>({
        success: true,
        user: userData,
        token: response.data.token
      });
    } catch (error) {
      const axiosError = error as AxiosError<BackendErrorResponse>;
      console.error('Backend API error:', axiosError.message);
      console.error('Error details:', axiosError.response?.data || 'No response data');
      
      // Network hatası durumunda Docker bağlantı sorunları hakkında daha fazla bilgi
      if (axiosError.message === 'Network Error' || !axiosError.response) {
        return NextResponse.json<LoginResponse>(
          { 
            success: false, 
            error: `Could not connect to authentication service at ${backendUrl}. Please check Docker container network and backend service.` 
          },
          { status: 500 }
        );
      }
      
      // Backend'den gelen hata mesajlarını ileri aktar
      if (axiosError.response) {
        const errorMessage = axiosError.response.data?.message || 'Login failed';
        return NextResponse.json<LoginResponse>(
          { 
            success: false, 
            error: errorMessage
          },
          { status: axiosError.response.status }
        );
      }

      // Diğer hatalar
      return NextResponse.json<LoginResponse>(
        { 
          success: false, 
          error: 'Authentication service error' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json<LoginResponse>(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error as Error)?.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
} 
