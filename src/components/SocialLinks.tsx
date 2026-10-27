import { FiFileText, FiGithub, FiLinkedin } from "react-icons/fi";
import { site } from "@/content/site";
import CatToggle from "@/components/CatToggle";
import CopyEmail from "@/components/CopyEmail";
import ThemeToggle from "@/components/ThemeToggle";
import Tip from "@/components/Tip";

const icons = {
  github: FiGithub,
  linkedin: FiLinkedin,
  resume: FiFileText,
} as const;

const iconBtn =
  "inline-flex items-center justify-center rounded-md text-muted transition-colors hover:text-sky-700 dark:hover:text-sky-200";

export default function SocialLinks() {
  return (
    <ul className="mt-2 flex items-center gap-3">
      {site.socials.map((s, i) => {
        const Icon = icons[s.icon];
        return (
          <li key={s.label}>
            <Tip text={s.tip} align={i === 0 ? "start" : "center"}>
              <a
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noreferrer"
                className={iconBtn}
              >
                <Icon size={18} />
              </a>
            </Tip>
          </li>
        );
      })}
      <li>
        <CopyEmail email={site.email} className={iconBtn} />
      </li>
      <li>
        <CatToggle className={iconBtn} />
      </li>
    </ul>
  );
}
