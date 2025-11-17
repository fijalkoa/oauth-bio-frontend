import { BrowserRouter, Routes, Route } from "react-router-dom";
import PasswordLogin from "./PasswordLogin";
import Signup from "./Signup";
import HomePage from "./HomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PasswordLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<HomePage/>}/>
      </Routes>
    </BrowserRouter>
  );

}

export default App;
