-- Expiring offline access tokens need a refresh token stored with each session.
ALTER TABLE "Session"
  ADD COLUMN "refreshToken" TEXT,
  ADD COLUMN "refreshTokenExpires" TIMESTAMP(3);
