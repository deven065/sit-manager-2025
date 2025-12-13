"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.mainContent}>
          {/* Dashboard content goes here */}
        </main>
      </div>
    </div>
  );
}
