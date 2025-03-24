import React, { useState, useEffect } from "react";
import "./App.css";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

function App() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [result, setResult] = useState("");
  const [photo, setPhoto] = useState(null); // Hiển thị ảnh
  const [photoPath, setPhotoPath] = useState(null); // Dùng để chia sẻ
  const [message, setMessage] = useState("");

  // 🔔 Xin quyền thông báo khi mở app
  useEffect(() => {
    const setupNotifications = async () => {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === "granted") {
        await LocalNotifications.registerActionTypes({
          types: [{ id: "default", actions: [{ id: "ok", title: "OK" }] }],
        });
      }
    };
    setupNotifications();
  }, []);

  // 📸 Chụp hoặc chọn ảnh
  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        saveToGallery: true,
      });

      setPhoto(image.webPath); // Hiển thị
      setPhotoPath(image.path || image.webPath); // Dùng để chia sẻ
      setMessage("Đã chọn/chụp ảnh và lưu vào thư viện.");
    } catch (error) {
      setMessage("Chụp hoặc chọn ảnh bị lỗi hoặc bị hủy.");
    }
  };

  // ⚖️ Tính BMI và gửi thông báo
  const calculateBMI = async () => {
    if (!height || !weight) {
      setMessage("Vui lòng nhập đủ chiều cao và cân nặng.");
      setBmi(null);
      setResult("");
      return;
    }

    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    const bmiValue = (w / (h * h)).toFixed(1);
    setBmi(bmiValue);

    let status = "";
    if (bmiValue < 18.5) status = "Gầy";
    else if (bmiValue < 25) status = "Bình thường";
    else if (bmiValue < 30) status = "Thừa cân";
    else status = "Béo phì";
    setResult(status);
    setMessage("");

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Kết quả BMI",
          body: `Chỉ số BMI của bạn là ${bmiValue} (${status})`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  };

  // 📤 Chia sẻ kết quả BMI và/hoặc ảnh
  const shareResult = async () => {
    if (!bmi && !photoPath) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Không thể chia sẻ",
            body: "Vui lòng tính BMI hoặc chọn ảnh để chia sẻ.",
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
      return;
    }

    try {
      if (photoPath) {
        // ✅ Có ảnh
        await Share.share({
          title: "Chia sẻ kết quả BMI",
          text: bmi
            ? `Chỉ số BMI của tôi là ${bmi} (${result}). Xem ảnh của tôi nè!`
            : "Xem ảnh của tôi nè!",
          files: [photoPath],
          dialogTitle: "Chia sẻ ảnh và BMI",
        });
      } else if (bmi) {
        // ✅ Chỉ có BMI
        await Share.share({
          title: "Chia sẻ kết quả BMI",
          text: `Chỉ số BMI của tôi là ${bmi} (${result})`,
          dialogTitle: "Chia sẻ chỉ số BMI",
        });
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Chia sẻ thành công",
            body: "Bạn đã chia sẻ thành công!",
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch (error) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Chia sẻ thất bại",
            body: "Đã xảy ra lỗi khi chia sẻ.",
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    }
  };

  return (
    <div className="App">
      <h1>Tính chỉ số BMI</h1>

      <input
        type="number"
        placeholder="Nhập chiều cao (cm)"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
      />
      <input
        type="number"
        placeholder="Nhập cân nặng (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <button onClick={calculateBMI}>Tính BMI</button>

      {message && <p style={{ color: "red" }}>{message}</p>}

      {bmi && (
        <div>
          <p>
            <strong>BMI:</strong> {bmi}
          </p>
          <p>
            <strong>Đánh giá:</strong> {result}
          </p>
        </div>
      )}

      <button onClick={shareResult}>Chia sẻ kết quả</button>

      <button onClick={takePhoto}>Chụp hoặc chọn ảnh</button>

      <button
        onClick={async () => {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Test thông báo",
                body: "Thông báo đang hoạt động!",
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 1000) },
              },
            ],
          });
        }}
      >
        Test Thông Báo
      </button>

      {photo && (
        <div>
          <img
            src={photo}
            alt="Ảnh của bạn"
            style={{ width: "200px", marginTop: "10px" }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
