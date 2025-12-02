import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { emailService } from '@/services/email';

interface ComposeModalProps {
  visible: boolean;
  onCancel: () => void;
  onSend: () => void;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ visible, onCancel, onSend }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSend = async (values: { to: string; subject: string; body: string }) => {
    setLoading(true);
    try {
      await emailService.sendEmail(values.to, values.subject, values.body);
      message.success('Email sent successfully');
      form.resetFields();
      onSend();
    } catch (error) {
      message.error('Failed to send email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Compose Email"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSend}
      >
        <Form.Item
          name="to"
          label="To"
          rules={[
            { required: true, message: 'Please input recipient email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input placeholder="recipient@example.com" />
        </Form.Item>

        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please input subject!' }]}
        >
          <Input placeholder="Email subject" />
        </Form.Item>

        <Form.Item
          name="body"
          label="Message"
          rules={[{ required: true, message: 'Please input message content!' }]}
        >
          <Input.TextArea rows={6} placeholder="Write your message here..." />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Send
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ComposeModal;
