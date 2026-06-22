import React, { useActionState } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext.jsx';
import Icon from './Icon.jsx';

export default function LoginForm() {
  const { login } = useAuth();

  const [errorMessage, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const username = formData.get('username');
      const password = formData.get('password');

      if (!username || !password) {
        return 'Both username and password are required.';
      }

      try {
        await login(username, password);
        return null; // success
      } catch (err) {
        return err.message || 'Invalid username or password.';
      }
    },
    null
  );

  return (
    <Card className="shadow-lg border-0 rounded-4 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #457b9d, #2a9d8f)', height: '6px' }}></div>
      <Card.Body className="p-4 p-md-5">
        <h3 className="fw-bold mb-4 text-center text-dark" style={{ letterSpacing: '-0.5px' }}>
          Welcome back
        </h3>
        
        {errorMessage && (
          <Alert variant="danger" className="py-2 border-0 rounded-3">
            <Icon name="warn" className="me-2" /> {errorMessage}
          </Alert>
        )}

        <Form action={submitAction}>
          <Form.Group className="mb-4" controlId="formUsername">
            <Form.Label className="text-muted fw-semibold small">Username</Form.Label>
            <Form.Control
              name="username"
              type="text"
              placeholder="Enter username"
              className="py-2 px-3 border border-2 rounded-3"
              disabled={isPending}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formPassword">
            <Form.Label className="text-muted fw-semibold small">Password</Form.Label>
            <Form.Control
              name="password"
              type="password"
              placeholder="Enter password"
              className="py-2 px-3 border border-2 rounded-3"
              disabled={isPending}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            className="w-100 py-2.5 fw-bold border-0 rounded-3 shadow-sm btn-primary"
            disabled={isPending}
            style={{
              background: 'linear-gradient(135deg, #457b9d, #2a9d8f)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {isPending ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
