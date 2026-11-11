import { FiFileText, FiGithub, FiLinkedin } from "react-icons/fi";
import { site } from "@/content/site";
import CatToggle from "@/components/CatToggle";
import CopyEmail from "@/components/CopyEmail";
import Tip from "@/components/Tip";

const icons = {
  github: FiGithub,
  linkedin: FiLinkedin,
  resume: FiFileText,
} as const;

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-sm bg-line text-muted transition-colors hover:text-fg";

export default function SocialLinks() {
  return (
    <ul className="mt-3 flex items-center gap-2">
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
                <Icon size={16} />
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
