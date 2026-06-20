import React, { useState } from "react";
import { Plus, CalendarDays, Image as ImageIcon, User } from "lucide-react";
import { NavBar } from "../ui";
import Register from "./Register";
import CliBook from "./CliBook";
import CliMine from "./CliMine";
import CliGallery from "./CliGallery";
import CliProfile from "./CliProfile";

export default function ClientApp(props) {
  const { appts, ME, clients, registered, studioName } = props;
  const [tab, setTab] = useState("book");
  const me = clients.find((c) => c.id === ME);

  if (!registered) return <Register onDone={props.handleRegister} />;

  const titles = {
    book:    ["קביעת תור", studioName],
    mine:    ["התורים שלי", me?.name],
    gallery: ["הגלריה", "עבודות הסטודיו"],
    profile: ["הפרופיל שלי", me?.name],
  };
  const t = titles[tab];

  return (
    <>
      <div className="bf-appbar">
        <h1 className="bf-display">{t[0]}</h1>
        <div className="sub">{t[1]}</div>
      </div>
      <div className="bf-screen">
        {tab === "book"    && <CliBook {...props} />}
        {tab === "mine"    && <CliMine {...props} />}
        {tab === "gallery" && <CliGallery {...props} />}
        {tab === "profile" && <CliProfile me={me} ping={props.ping} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["book", Plus, "תור חדש"], ["mine", CalendarDays, "התורים שלי"],
        ["gallery", ImageIcon, "גלריה"], ["profile", User, "פרופיל"],
      ]} />
    </>
  );
}
