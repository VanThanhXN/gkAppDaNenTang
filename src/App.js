import React, { useState } from "react";
import "./App.css";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";
import { Camera } from "@capacitor/camera";

function App() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [status, setStatus] = useState("");
  const [photo, setPhoto] = useState(null);

  const calculateBMI = async () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    const result = w / (h * h);
    const bmiValue = result.toFixed(2);
    setBmi(bmiValue);

    let bmiStatus = "";
    if (result < 18.5) bmiStatus = "Gầy";
    else if (result < 25) bmiStatus = "Bình thường";
    else if (result < 30) bmiStatus = "Thừa cân";
    else bmiStatus = "Béo phì";
    setStatus(bmiStatus);

    // Thông báo Local
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Kết quả BMI",
          body: `BMI: ${bmiValue} - ${bmiStatus}`,
          id: 1,
        },
      ],
    });
  };

  const shareResult = async () => {
    if (!bmi) return;
    await Share.share({
      title: "Chia sẻ BMI",
      text: `Chỉ số BMI của tôi là ${bmi} - ${status}`,
    });
  };

  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: "dataUrl",
    });
    setPhoto(image.dataUrl);
  };

  return (
    <div className="App">
      <h1>Tính BMI</h1>
      <input
        type="number"
        placeholder="Chiều cao (cm)"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
      />
      <input
        type="number"
        placeholder="Cân nặng (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <button onClick={calculateBMI}>Tính BMI</button>

      {bmi && (
        <div>
          <p>BMI: {bmi}</p>
          <p>Đánh giá: {status}</p>
          <button onClick={shareResult}>Chia sẻ kết quả</button>
        </div>
      )}

      <div>
        <button onClick={takePhoto}>Chụp ảnh</button>
        {photo && (
          <img
            src={photo}
            alt="User"
            style={{ width: "200px", marginTop: "10px" }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
