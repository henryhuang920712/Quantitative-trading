"use client";

function MyPortfolio() {
  return (
    <nav className="">
      <div className="fs-5 px-3 py-1 fw-bold">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bookmark-star-fill me-2 mb-1" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5M8.16 4.1a.178.178 0 0 0-.32 0l-.634 1.285a.18.18 0 0 1-.134.098l-1.42.206a.178.178 0 0 0-.098.303L6.58 6.993c.042.041.061.1.051.158L6.39 8.565a.178.178 0 0 0 .258.187l1.27-.668a.18.18 0 0 1 .165 0l1.27.668a.178.178 0 0 0 .257-.187L9.368 7.15a.18.18 0 0 1 .05-.158l1.028-1.001a.178.178 0 0 0-.098-.303l-1.42-.206a.18.18 0 0 1-.134-.098z"/>
      </svg>
      我的投資組合
      </div>
      <div className="bg-light w-100">

        <ul className="nav flex-column">
          <li className="nav-item">
            <a className="nav-link active" href="#">
              Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Link 1
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Link 2
            </a>
          </li>
        </ul>
      </div>
    </nav>
    )
}

function HotTrades() {
  return (
    <nav className="">
      <div className="fs-5 px-3 py-1 fw-bold">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-bar-chart-line-fill me-2 mb-1" viewBox="0 0 16 16">
      <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1z"/>
      </svg>
      熱門交易
      </div>
      <div className="bg-light w-100">

        <ul className="nav flex-column">
          <li className="nav-item">
            <a className="nav-link active" href="#">
              Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Link 1
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Link 2
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default function Sidebar() {
  return (
    <div className="container-fluid col-md-3 col-lg-3 d-md-block sidebar">
      <div className="row mb-2 h-50">
        <MyPortfolio />
      </div>
      <div className="row h-50">
        <HotTrades />
      </div>
    </div>
  )
}