import { Bell, BellDot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { smoothScrollToElement } from "./lib/utils";

function App() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastViewedNotification, setLastViewedNotification] = useState(
    localStorage.getItem("lastViewedNotification")
  );

  const notificationsRef = useRef([]);

  const addNotification = (notification) => {
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      notification,
    ]);
  };

  const markAsViewed = (uuid) => {
    fetch("http://localhost:3000/mark-as-viewed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid }),
    }).then((response) => {
      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.uuid === uuid
              ? { ...notification, viewed: true }
              : notification
          )
        );
        localStorage.setItem("lastViewedNotification", uuid);
      } else {
        alert("Error al marcar la notificación como vista");
      }
    });
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      addNotification(newNotification);

      setHasNewNotifications((prevHasNew) => {
        return prevHasNew || !newNotification.viewed;
      });
    };

    fetch("http://localhost:3000/notifications")
      .then((response) => response.json())
      .then((data) => {
        setNotifications(data);

        const hasNew = data.some((notification) => !notification.viewed);
        setHasNewNotifications(hasNew);
      });

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (showNotifications && lastViewedNotification) {
      const lastNotificationElement =
        document.getElementById("last-notification");
      const notificationsContainer = document.getElementById(
        "container-notifications"
      );

      if (lastNotificationElement && notificationsContainer) {
        smoothScrollToElement(
          lastNotificationElement,
          notificationsContainer,
          1000
        );
      }
    }
  }, [showNotifications, notifications]);

  useEffect(() => {
    if (!showNotifications) {
      const newNotifications = notifications.filter(
        (notification) => !notification.viewed
      );

      newNotifications.forEach((notification) => {
        markAsViewed(notification.uuid);
      });

      setHasNewNotifications(false);
    }
  }, [showNotifications]);

  return (
    <main className="flex flex-col items-center min-h-screen bg-accent-foreground text-accent">
      <header className="h-16 w-full max-w-[900px] flex justify-center items-center">
        <nav className="flex gap-6">
          {!hasNewNotifications && (
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
              }}
              className="relative hover:bg-accent/10 hover:cursor-pointer p-1.5 rounded-full"
            >
              <Bell />
            </button>
          )}
          {hasNewNotifications && (
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
              }}
              className="relative hover:bg-accent/10 hover:cursor-pointer p-1.5 rounded-full"
            >
              <BellDot />
              <div className="absolute top-[10px] right-[7px] w-[9px] h-[9px] rounded-full bg-red-500" />
            </button>
          )}
        </nav>
      </header>
      {showNotifications && (
        <div className="py-10">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <section
            id="container-notifications"
            className="flex flex-col max-h-[calc(100vh-200px)] 
              overflow-y-scroll border border-background p-8 mt-4 gap-4"
          >
            {notifications.map((notification, index) => (
              <div key={notification.uuid}>
                {!notification.viewed && notifications[index - 1]?.viewed && (
                  <div
                    id="separator"
                    className="relative flex justify-center items-center pt-2 pb-6"
                  >
                    <hr className="w-full" />
                    <p className="absolute text-center text-xs text-accent font-mono uppercase p-1 px-4 bg-accent-foreground">
                      recientes
                    </p>
                  </div>
                )}

                <div
                  id={
                    notifications.length - 1 === index
                      ? "last-notification"
                      : ""
                  }
                  ref={(el) => (notificationsRef.current[index] = el)}
                  className={`flex flex-col gap-2 rounded-xl pt-4 bg-background/10 ${
                    notification.viewed ? "viewed" : "new"
                  }`}
                >
                  <p className="px-4">
                    <strong>{notification.title}</strong>
                  </p>
                  <pre className="text-xs px-4 py-4 bg-black">
                    {JSON.stringify(notification.detail_notification, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
