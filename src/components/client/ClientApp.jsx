import React, { useState } from "react";
import { Plus, CalendarDays, Image as ImageIcon, User } from "lucide-react";
import { NavBar } from "../ui";
import ClientAuth from "./ClientAuth";
import CliBook from "./CliBook";
import CliMine from "./CliMine";
import CliGallery from "./CliGallery";
import CliProfile from "./CliProfile";

export default function ClientApp({ cli }) {
  const [tab, setTab] = useState("book");

  if (!cli.client) return <ClientAuth cli={cli} />;

  const me = cli.client;
  const titles = {
    book:    ["קביעת תור", cli.studioName],
    mine:    ["התורים שלי", me.name],
    gallery: ["הגלריה", "עבודות הסטודיו"],
    profile: ["הפרופיל שלי", me.name],
  };
  const t = titles[tab];

  return (
    <>
      <div className="bf-appbar">
        <h1 className="bf-display">{t[0]}</h1>
        <div className="sub">{t[1]}</div>
      </div>
      <div className="bf-screen">
        {tab === "book"    && <CliBook cli={cli} />}
        {tab === "mine"    && <CliMine cli={cli} />}
        {tab === "gallery" && <CliGallery cli={cli} />}
        {tab === "profile" && <CliProfile cli={cli} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["book", Plus, "תור חדש"], ["mine", CalendarDays, "התורים שלי"],
        ["gallery", ImageIcon, "גלריה"], ["profile", User, "פרופיל"],
      ]} />
    </>
  );
}
