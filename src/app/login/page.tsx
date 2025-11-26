'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

const { Title, Text, Link } = Typography;

interface FormValues {
  email: string;
  password: string;
  name?: string;
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, signup, googleAuth } = useAuth();
  const [form] = Form.useForm();

  const handleEmailAuth = async (values: FormValues) => {
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email: values.email, password: values.password });
        message.success('Login successful!');
      } else {
        await signup({ 
          email: values.email, 
          password: values.password, 
          name: values.name || ""
        });
        message.success('Signup successful!');
      }
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.message || (error as Error).message || 'Authentication failed';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      message.error('Google authentication failed');
      return;
    }

    setLoading(true);
    try {
      await googleAuth({ token: credentialResponse.credential });
      message.success('Google authentication successful!');
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.message || 'Google authentication failed';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    message.error('Google authentication failed');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.resetFields();
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
        <Card className="w-full max-w-[450px] rounded-xl shadow-2xl">
          <div className="text-center mb-8">
            <MailOutlined className="text-5xl text-[#667eea]" />
            <Title level={2} className="!mt-4 !mb-2">
              AI Email Box
            </Title>
            <Text type="secondary">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </Text>
          </div>

          <Form
            form={form}
            name="auth"
            onFinish={handleEmailAuth}
            layout="vertical"
            size="large"
          >
            {!isLogin && (
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: 'Please input your name!' },
                  { min: 2, message: 'Name must be at least 2 characters' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Full Name"
                />
              </Form.Item>
            )}

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                type="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="h-12 text-base"
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>
            <Text type="secondary">OR</Text>
          </Divider>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              size="large"
              text={isLogin ? 'signin_with' : 'signup_with'}
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="text-center">
            <Text type="secondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <Link onClick={toggleMode} className="font-medium">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Link>
          </div>
        </Card>
      </div>
    </GoogleOAuthProvider>
  );
}
