// function errorHandler(error,req,res,next){
// res.status(500).json({
//     success:false,
//     messsage:'Server Error',
//     error:error.messsage
// });
// }
// module.exports=errorHandler

const errorHandler = (err, req, res, next) => {
  console.error("EXPRESS ERROR:", err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};

module.exports = errorHandler;
