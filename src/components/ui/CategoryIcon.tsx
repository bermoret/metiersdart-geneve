type Props = {
  icon: string; // classe Font Awesome ex: "fas fa-tshirt"
  className?: string;
};

export function CategoryIcon({ icon, className }: Props) {
  return <i className={`${icon} ${className ?? ""}`} aria-hidden />;
}
