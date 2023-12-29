"use client";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export function NavBarItem(props) {
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
            <Nav.Link href="#Login" className="mx-0">Login</Nav.Link>
            <Nav.Link href="#Register" className="">Register</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}