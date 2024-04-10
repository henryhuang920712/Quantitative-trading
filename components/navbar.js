"use client";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { useSession, signIn} from "next-auth/react";
import { usePathname } from 'next/navigation';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {useRouter} from 'next/navigation';

const RegisterModal = (props) => {
  const [response, setResponse] = useState(null);
  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
    },
    validateOnChange: false,
    validationSchema: yup.object({
      firstName: yup.string().required("Required"),
      lastName: yup.string().required("Required"),
      username: yup.string().required("Required"),
      email: yup.string().email("Invalid email address"),
      password: yup.string().required("Required").min(8, "Must be at least 8 characters")
    }),
    onSubmit: async (values) => {
      try {
        values.role = "credentialed_user";
        // connect to /api/user
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const status = response.status;
        if (status == 400) {
          formik.setFieldError('email', 'Username or email already exists');
          formik.setFieldError('username', 'Username or email already exists');
        }
        const data = await response.json();
        data.status = status;
        setResponse(data);

      } catch (error) {
        // Handle errors
        console.error(error.message);
        console.log(response);
      }
    },
  });

  const handleExit = () => {
    if (response && response.status == 200) {
      formik.resetForm();
    }
    setResponse(null);
  }

  return (
  <Modal {...props} centered onExit={handleExit}>
  <Modal.Header closeButton>
    <Modal.Title>Register</Modal.Title>
  </Modal.Header>
  <Form noValidate onSubmit={formik.handleSubmit}>
  <Modal.Body>
      <Row>
        <Form.Group className="mb-3" as={Col} md="6" controlId="registerform.firstNameID">
        <Form.Label>First name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  onChange={formik.handleChange}
                  value={formik.values.firstName}
                  isInvalid={!!formik.errors.firstName}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.firstName}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" as={Col} md="6" controlId="registerform.lastNameID">
          <Form.Label>Last name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  onChange={formik.handleChange}
                  value={formik.values.lastName}
                  isInvalid={!!formik.errors.lastName}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.lastName}</Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row>
          <Form.Group className="mb-3" controlId="registerform.usernameID">
          <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  onChange={formik.handleChange}
                  value={formik.values.username}
                  isInvalid={!!formik.errors.username}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.username}</Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row>
        <Form.Group controlId="registerform.emailID">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          name='email'
          placeholder="name@example.com"
          onChange={formik.handleChange}
          value={formik.values.email}
          isInvalid={!!formik.errors.email}
        />
        <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
      </Form.Group>
      </Row>
      <Row>
          <Form.Group className="mb-3" controlId="registerform.passwordID">
          <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  onChange={formik.handleChange}
                  value={formik.values.password}
                  isInvalid={!!formik.errors.password}
                  autoComplete="on"
                />
                <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
          </Form.Group>
      </Row>
      <Row>
      {response &&  <Alert variant={response.status == 200 ? "success" : "danger"}>
        {response.message}
    </Alert>}
    </Row>
  </Modal.Body>
  <Modal.Footer>
  <Button variant="secondary" className="ms-auto" onClick={props.onHide}>
      Close
    </Button>
      <Button variant="success" className="mx-2" type="submit">
      Submit
    </Button>
    </Modal.Footer>
  </Form>
</Modal>
  );
}

const LoginModal = (props) => {
  const {data: session, status} = useSession();
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validateOnChange: false,
    validationSchema: yup.object({
      username: yup.string().required("Required"),
      password: yup.string().required("Required").min(8, "Must be at least 8 characters")
    }),
    onSubmit: async (values) => {
      try {
        if (!session) {
          const session = await signIn("credentials", {
            username: values.username,
            password: values.password,
            callbackUrl: router.pathname,
            redirect: false,
          });
          if (session.error == null) {
            router.push(session.url);
            location.reload();
          } else {
            if (session.error == "User not found") {
              formik.setFieldError('username', 'User not found');
            } else if (session.error == "Wrong password") {
              formik.setFieldError('password', 'Wrong password');
            }
          }
        }
      } catch (error) {
        formik.setFieldError("password", error);
      }
    }
  });

  return (
  <Modal {...props} centered>
  <Modal.Header closeButton>
    <Modal.Title>Login</Modal.Title>
  </Modal.Header>
  <Form noValidate onSubmit={formik.handleSubmit}>
  <Modal.Body>
        <Row>
          <Form.Group className="mb-3" controlId="registerform.usernameID">
          <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  onChange={formik.handleChange}
                  value={formik.values.username}
                  isInvalid={!!formik.errors.username}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.username}</Form.Control.Feedback>
          </Form.Group>
        </Row>
      <Row>
          <Form.Group className="mb-3" controlId="registerform.passwordID">
          <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  onChange={formik.handleChange}
                  value={formik.values.password}
                  isInvalid={!!formik.errors.password}
                  autoComplete="on"
                />
                <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
          </Form.Group>
      </Row>
  </Modal.Body>
  <Modal.Footer>
  <Button variant="secondary" className="ms-auto" onClick={props.onHide}>
      Close
    </Button>
      <Button variant="success" className="mx-2" type="submit">
      Submit
    </Button>
    </Modal.Footer>
  </Form>
    <Modal.Footer>
    <Row className="w-100 position-relative">
    <span className="position-absolute top-0 start-50 text-center translate-middle-x bg-light-subtle" style={{width: "fit-content", marginTop: "-30px"}}>or</span>
    </Row>
    <Button variant="outline-success" onClick={async () => await signIn("google")} className="w-100 mx-2 d-flex flex-row align-items-center rounded-pill mx-4 my-2">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" className="flex-shrink-1 ms-2" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" id="google"><path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path><path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path><path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path><path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path></svg>
    <span className="text-center w-100">Sign in with Google</span>
    </Button>
    <Button variant="outline-secondary" onClick={async () => await signIn("github")} className="w-100 mx-2 d-flex flex-row align-items-center rounded-pill mx-4 my-3">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" className="flex-shrink-1 ms-2" viewBox="0 0 16 16" id="github"><path d="M7.999 0C3.582 0 0 3.596 0 8.032a8.031 8.031 0 0 0 5.472 7.621c.4.074.546-.174.546-.387 0-.191-.007-.696-.011-1.366-2.225.485-2.695-1.077-2.695-1.077-.363-.928-.888-1.175-.888-1.175-.727-.498.054-.488.054-.488.803.057 1.225.828 1.225.828.714 1.227 1.873.873 2.329.667.072-.519.279-.873.508-1.074-1.776-.203-3.644-.892-3.644-3.969 0-.877.312-1.594.824-2.156-.083-.203-.357-1.02.078-2.125 0 0 .672-.216 2.2.823a7.633 7.633 0 0 1 2.003-.27 7.65 7.65 0 0 1 2.003.271c1.527-1.039 2.198-.823 2.198-.823.436 1.106.162 1.922.08 2.125.513.562.822 1.279.822 2.156 0 3.085-1.87 3.764-3.652 3.963.287.248.543.738.543 1.487 0 1.074-.01 1.94-.01 2.203 0 .215.144.465.55.386A8.032 8.032 0 0 0 16 8.032C16 3.596 12.418 0 7.999 0z"></path></svg><span className="text-center w-100">Sign in with Github</span>
    </Button>
    </Modal.Footer>
</Modal>
  );
}

export function NavBarItem(props) {
  const [registerModalShow, setRegisterModalShow] = useState(false);
  const [loginModalShow, setLoginModalShow] = useState(false);
  const {data: session, status} = useSession();
  const pathname = usePathname();

  return (
      <Navbar expand="lg" className="bg-body-tertiary mw-100 flex-fill d-flex" style={{maxHeight: "10vh"}}>
        <Container fluid className="mx-4 px-1 h-100">
          <Navbar.Brand href="/" className="d-flex flex-row align-items-center font-weight-bold mt-1 px-0 h-100 me-5">
            <img
                src="/logo.png"
                width="60"
                height="60"
                className="d-inline-block align-middle"
                alt="React Bootstrap logo"
            />
            <h5 className="mt-1 fw-bold">
              StockVista
            </h5>
            </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="bg-body-tertiary px-3 rounded-4 rounded-top-0 z-1">
            <Nav className="w-100 d-flex flex-lg-row flex-column justify-content-lg-between pb-lg-0 pb-3">
              <Container fluid id="nav-container" className="px-0">
              <Nav.Link href="/" className="">Home</Nav.Link>
              <Nav.Link href="/info" className="">Info</Nav.Link>
              <Nav.Link href="#analysis" className="">Analysis</Nav.Link>
              <Form className="d-flex">
                    <Form.Control
                      type="search"
                      placeholder="Search"
                      className="me-2"
                      aria-label="Search"
                    />
                    <Button variant="outline-success">Search</Button>
              </Form>
              </Container>
              {status === "authenticated" ? <Nav.Link href={`/api/auth/signout?callbackUrl=${pathname}`} className="mx-0">{session.user?.email}</Nav.Link>
              :
              <Nav.Link href="/api/auth/signin" className="mx-0" onClick={(e) => {e.preventDefault(); setLoginModalShow(true);}} >Login</Nav.Link>
              }
              <Button variant="outline-success" className="mx-0" onClick={() => setRegisterModalShow(true)}>Register</Button>
            </Nav>
          </Navbar.Collapse>

          <RegisterModal show={registerModalShow} onHide={() => setRegisterModalShow(false)} />
          <LoginModal show={loginModalShow} onHide={() => setLoginModalShow(false)} />
        </Container>
      </Navbar>
  );
}