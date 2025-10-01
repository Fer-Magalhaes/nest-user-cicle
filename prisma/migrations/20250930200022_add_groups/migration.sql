-- CreateTable
CREATE TABLE "public"."Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "public"."Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_userId_groupId_key" ON "public"."UserGroup"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "public"."UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserGroup" ADD CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
