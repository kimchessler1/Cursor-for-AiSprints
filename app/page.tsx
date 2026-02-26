import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to MCQs page - middleware will handle authentication
  redirect("/mcqs");
}
