import { checkToken } from "@lib/checkToken";
import { Database, Payload } from "@lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@lib/getPrisma";

export const GET = async () => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }

  // Type casting to "Payload" and destructuring to get data
  const { role, studentId } = <Payload>payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  const prisma = getPrisma();

  // get courses but no title
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: studentId },
    include: { course: true },
  });

  // console.log(enrollments);

  return NextResponse.json({
    ok: true,
    enrollments: enrollments,
  });
};

export const POST = async (request: NextRequest) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = <Payload>payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  //read body request
  const body = await request.json();
  const { courseNo } = body;
  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  // Coding in lecture
  const prisma = getPrisma();

  // get courses but no title
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: studentId },
    include: { course: true },
  });

  //check if courses does not exist
  const course = await prisma.course.findMany({
    where: { courseNo },
  });
  const findCourse = course.find((c) => c.courseNo === courseNo);
  if (!findCourse) {
    return NextResponse.json({
    ok: false,
    message: "Course number does not exist",
    },
    { status: 400 }
  );}

  // check if already enrolled
  const isEnrolled = enrollments.find((enrollment) => enrollment.courseNo === courseNo);
  if (isEnrolled) {
    return NextResponse.json({
    ok: false,
    message: "You already registered this course",
    },
    { status: 400 }
  );}

  await prisma.enrollment.create({
    data:{studentId: studentId, courseNo: courseNo},
  });

  return NextResponse.json({
    ok: true,
    message: "You has enrolled a course successfully",
  });
};

// Need review together with drop enrollment form.
export const DELETE = async (request: NextRequest) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = <Payload>payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  // read body request ***
  const body = await request.json();
  const { courseNo } = body;
  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  const prisma = getPrisma();
  // get courses but no title
  const enrollments = await prisma.enrollment.findMany({
      where: { studentId: studentId },
      include: { course: true },
    });

  const isEnrolled = enrollments.find((enrollment) => enrollment.courseNo === courseNo);
  if (!isEnrolled) {
    return NextResponse.json({
    ok: false,
    message: "You cannot drop from this course. You have not enrolled it yet!",
    },
    { status: 400 }
  );}

  // Perform data delete
  await prisma.enrollment.delete({
    where: {
      courseNo_studentId: {
      courseNo: courseNo,  // courseNo ที่ต้องการลบ
      studentId: studentId // studentId ที่ต้องการลบ
      }
    }
  });

  return NextResponse.json({
    ok: true,
    message: "You has dropped from this course. See you next semester.",
  });
};