"use client";
import { useState } from "react";
import styles from "./Sidebar.module.css";

const menuItems = {
  favorites: [
    { name: "Overview", icon: "chart" },
    { name: "Projects", icon: "folder" }
  ],
  dashboards: [
    { name: "Overview", icon: "pie" },
    { name: "Admin", icon: "laptop" }
  ],
  pages: [
    { name: "CBD", icon: "document" },
    { name: "Training & Development", icon: "presentation" },
    { name: "Accounts", icon: "calculator" },
    { name: "Placement", icon: "badge" },
    { name: "Purchase", icon: "cart" },
    { name: "Leadership", icon: "people" },
    { name: "Quality Assurance", icon: "checkmark" },
    { name: "Human Resources", icon: "person" },
    { name: "Corporate Training", icon: "briefcase" }
  ]
};

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Overview");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <img src="/SIT-logo.png" alt="SIT" className={styles.logo} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLetter}>F</span>
            <h3 className={styles.sectionTitle}>Favorites</h3>
          </div>
          {menuItems.favorites.map((item) => (
            <button
              key={item.name}
              className={`${styles.menuItem} ${activeItem === item.name ? styles.active : ""}`}
              onClick={() => setActiveItem(item.name)}
            >
              <span className={styles.icon}>{getIcon(item.icon)}</span>
              <span className={styles.label}>{item.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLetter}>D</span>
            <h3 className={styles.sectionTitle}>Dashboards</h3>
          </div>
          {menuItems.dashboards.map((item) => (
            <button
              key={item.name}
              className={`${styles.menuItem} ${activeItem === item.name ? styles.active : ""}`}
              onClick={() => setActiveItem(item.name)}
            >
              <span className={styles.icon}>{getIcon(item.icon)}</span>
              <span className={styles.label}>{item.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLetter}>P</span>
            <h3 className={styles.sectionTitle}>Pages</h3>
          </div>
          {menuItems.pages.map((item) => (
            <button
              key={item.name}
              className={`${styles.menuItem} ${activeItem === item.name ? styles.active : ""}`}
              onClick={() => setActiveItem(item.name)}
            >
              <span className={styles.icon}>{getIcon(item.icon)}</span>
              <span className={styles.label}>{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function getIcon(type) {
  const icons = {
    chart: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 10L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 10L15.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    folder: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 15C18 15.5304 17.7893 16.0391 17.4142 16.4142C17.0391 16.7893 16.5304 17 16 17H4C3.46957 17 2.96086 16.7893 2.58579 16.4142C2.21071 16.0391 2 15.5304 2 15V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H7L9 6H16C16.5304 6 17.0391 6.21071 17.4142 6.58579C17.7893 6.96086 18 7.46957 18 8V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    pie: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 3C10 3 10 10 10 10L16.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    laptop: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 13V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H16C16.5304 3 17.0391 3.21071 17.4142 3.58579C17.7893 3.96086 18 4.46957 18 5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 17H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 13H18V15C18 15.5304 17.7893 16.0391 17.4142 16.4142C17.0391 16.7893 16.5304 17 16 17H4C3.46957 17 2.96086 16.7893 2.58579 16.4142C2.21071 16.0391 2 15.5304 2 15V13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    document: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V16C4 16.5304 4.21071 17.0391 4.58579 17.4142C4.96086 17.7893 5.46957 18 6 18H14C14.5304 18 15.0391 17.7893 15.4142 17.4142C15.7893 17.0391 16 16.5304 16 16V6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2V6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    presentation: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 3H18V12H2V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 12V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 7L8 9L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    calculator: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 2H15C16.1046 2 17 2.89543 17 4V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V4C3 2.89543 3.89543 2 5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 5H14V8H6V5Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 12H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 12H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M13 12H13.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 15H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 15H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M13 15H13.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    badge: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10C3 10 3.5 9 6 9C8.5 9 9.5 11 12 11C14.5 11 15 10 15 10V2C15 2 14.5 3 12 3C9.5 3 8.5 1 6 1C3.5 1 3 2 3 2V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1, 3)"/>
        <path d="M3 10V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="translate(1, 3)"/>
        <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    cart: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="17" r="1" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="16" cy="17" r="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 1H4L6.68 11.39C6.77144 11.8504 7.02191 12.264 7.38755 12.5583C7.75318 12.8526 8.2107 13.009 8.68 13H15.4C15.8693 13.009 16.3268 12.8526 16.6925 12.5583C17.0581 12.264 17.3086 11.8504 17.4 11.39L19 4H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    people: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 17V15C14 13.9391 13.5786 12.9217 12.8284 12.1716C12.0783 11.4214 11.0609 11 10 11H4C2.93913 11 1.92172 11.4214 1.17157 12.1716C0.421427 12.9217 0 13.9391 0 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1, 0)"/>
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 11C17.0609 11 18.0783 10.5786 18.8284 9.82843C19.5786 9.07828 20 8.06087 20 7C20 5.93913 19.5786 4.92172 18.8284 4.17157C18.0783 3.42143 17.0609 3 16 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-1, 0)"/>
        <path d="M19 17V15C19 14.0853 18.7068 13.2516 18.2 12.5916" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-1, 0)"/>
      </svg>
    ),
    checkmark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    person: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 17V15C16 13.9391 15.5786 12.9217 14.8284 12.1716C14.0783 11.4214 13.0609 11 12 11H8C6.93913 11 5.92172 11.4214 5.17157 12.1716C4.42143 12.9217 4 13.9391 4 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    briefcase: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 6H3C2.44772 6 2 6.44772 2 7V16C2 16.5523 2.44772 17 3 17H17C17.5523 17 18 16.5523 18 16V7C18 6.44772 17.5523 6 17 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 6V4C13 3.46957 12.7893 2.96086 12.4142 2.58579C12.0391 2.21071 11.5304 2 11 2H9C8.46957 2 7.96086 2.21071 7.58579 2.58579C7.21071 2.96086 7 3.46957 7 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 10H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  };
  return icons[type] || icons.document;
}
