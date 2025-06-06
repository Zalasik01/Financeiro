import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center p-8 rounded-lg shadow-lg bg-card border border-border">
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <p className="text-2xl text-muted-foreground mb-6">
          Oops! Página não encontrada.
        </p>
        <Button asChild>
          <Link to="/">Voltar para a Página Inicial</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
