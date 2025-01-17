
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES  */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- 테이블 public.character 구조 내보내기
CREATE TABLE IF NOT EXISTS "character" (
	"id" SERIAL NOT NULL,
	"gameId" INTEGER NOT NULL,
	"pageId" VARCHAR NULL DEFAULT NULL,
	"isNew" BOOLEAN NULL DEFAULT false,
	"isReleased" BOOLEAN NULL DEFAULT false,
	"name" JSONB NOT NULL,
	"element" VARCHAR NULL DEFAULT NULL,
	"path" VARCHAR NULL DEFAULT NULL,
	"rarity" VARCHAR NULL DEFAULT NULL,
	"voiceActors" JSONB NULL DEFAULT NULL,
	"releaseDate" DATE NULL DEFAULT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "character_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.character_details 구조 내보내기
CREATE TABLE IF NOT EXISTS "character_details" (
	"id" SERIAL NOT NULL,
	"characterId" INTEGER NOT NULL,
	"lang" VARCHAR NOT NULL DEFAULT 'kr',
	"stats" JSONB NULL DEFAULT NULL,
	"itemData" JSONB NULL DEFAULT NULL,
	"ranks" JSONB NULL DEFAULT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "character_details_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "character" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.character_image 구조 내보내기
CREATE TABLE IF NOT EXISTS "character_image" (
	"id" SERIAL NOT NULL,
	"characterId" INTEGER NOT NULL,
	"backgroundColor" VARCHAR NOT NULL DEFAULT '#ffffff',
	"layout" VARCHAR NULL DEFAULT NULL,
	"url" TEXT NOT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "character_image_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "character" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.game 구조 내보내기
CREATE TABLE IF NOT EXISTS "game" (
	"id" SERIAL NOT NULL,
	"title" JSONB NOT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.game_image 구조 내보내기
CREATE TABLE IF NOT EXISTS "game_image" (
	"id" SERIAL NOT NULL,
	"gameId" INTEGER NOT NULL,
	"url" TEXT NOT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "game_image_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.game_setting 구조 내보내기
CREATE TABLE IF NOT EXISTS "game_setting" (
	"id" SERIAL NOT NULL,
	"gameId" INTEGER NOT NULL,
	"devCorp" VARCHAR NOT NULL,
	"relatedUrl" JSONB NULL DEFAULT NULL,
	"storeUrl" JSONB NULL DEFAULT NULL,
	"setting" JSONB NULL DEFAULT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "game_setting_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.item 구조 내보내기
CREATE TABLE IF NOT EXISTS "item" (
	"id" SERIAL NOT NULL,
	"characterId" INTEGER NULL DEFAULT 0,
	"gameId" INTEGER NOT NULL,
	"itemtype" VARCHAR NULL DEFAULT NULL,
	"element" VARCHAR NULL DEFAULT NULL,
	"name" JSONB NULL DEFAULT NULL,
	"desc" JSONB NULL DEFAULT NULL,
	"path" VARCHAR NULL DEFAULT NULL,
	"rarity" VARCHAR NULL DEFAULT NULL,
	"levelData" JSONB NULL DEFAULT NULL,
	"itemReferences" JSONB NULL DEFAULT NULL,
	"skillId" INTEGER NULL DEFAULT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.path_type 구조 내보내기
CREATE TABLE IF NOT EXISTS "path_type" (
	"id" SERIAL NOT NULL,
	"characterId" INTEGER NOT NULL,
	"group" VARCHAR NOT NULL,
	"name" JSONB NOT NULL,
	"info" VARCHAR NULL DEFAULT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 public.path_type_image 구조 내보내기
CREATE TABLE IF NOT EXISTS "path_type_image" (
	"id" SERIAL NOT NULL,
	"pathTypeId" INTEGER NOT NULL,
	"backgroundColor" VARCHAR NOT NULL DEFAULT '#ffffff',
	"layout" VARCHAR NULL DEFAULT NULL,
	"url" TEXT NOT NULL,
	"deletedAt" TIMESTAMP NULL DEFAULT NULL,
	"createdAt" TIMESTAMP NULL DEFAULT NULL,
	"updatedAt" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
);

-- 내보낼 데이터가 선택되어 있지 않습니다.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
