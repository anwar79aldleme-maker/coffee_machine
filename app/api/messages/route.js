export async function POST(request) {
  try {
    const body = await request.json();
    console.log("استلمت بيانات:", body);
    
    return Response.json({ 
      success: true, 
      message: "تم الاستلام", 
      data: body 
    });
  } catch (error) {
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ message: "API تعمل بشكل صحيح" });
}
