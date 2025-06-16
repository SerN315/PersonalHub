import React from "react";
import Link from "next/link";
import "@/app/styles/ui/NavLinkItem.scss";
import BasicIcon from "../ultis/icons";
import * as Icons from "@hugeicons/core-free-icons";

interface NavLinkItemProps {
  label: string;
  href: string;
  isActive?: boolean;
  id?: string;
  iconName?: keyof typeof Icons;
  onclick?: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({
  label,
  href,
  id,
  isActive = false,
  iconName = "Notification01Icon",
  onclick = () => {},
}) => {
  return (
    <li className="nav-item" id={id} onClick={onclick}>
      <Link href={href} className={`nav-link ${isActive ? "active" : ""}`}>
        <BasicIcon icon={iconName} size={20} />
        {label}
      </Link>
    </li>
  );
};

export default NavLinkItem;
