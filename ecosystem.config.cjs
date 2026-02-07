module.exports = {
  apps: [
    {
      name: "instantpdf",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "5001",
        JWT_SECRET: "lksdjisiduf07ffsfhsfds",
        DATABASE_URL: "postgresql://postgres:gouravgn11@instantpdf-db.c78aak402ela.ap-south-1.rds.amazonaws.com:5432/instantpdf?sslmode=require&uselibpqcompat=true",
        PGSSLMODE: "require"
      }
    }
  ]
};
