<?php
ini_set('display_errors', 'off');
header("Content-type: text/html; charset=utf-8"); 

$targetFolder = 'upload123'; // upload path
// Create target dir
if (!file_exists($targetFolder)) {
    @mkdir($targetFolder);
}
error_logger('a:'.getRequest('a'));
error_logger('b:'.getRequest('b'));
$RootDir = $_SERVER['DOCUMENT_ROOT']; 
$tempFile = $_FILES['file']['tmp_name'];
//echo $tempFile;
//$targetPath = $_SERVER['DOCUMENT_ROOT'] . $targetFolder;
$targetPath =  $targetFolder;
$targetFile = rtrim($targetPath,'/') . '/' . $_FILES['file']['name'];


$fileParts = pathinfo($_FILES['file']['name']);
move_uploaded_file($tempFile,$targetFile);

echo '{"message":"ok"}';
//echo "<script>top.upload_callback_1({url:'".$targetFile."'});</script>";
function error_logger($content){
    file_put_contents("error_log.html",date('Y-m-d H:i:s ').$content.'<br>',FILE_APPEND);
}
function getRequest($name=''){
	$result = '';

	if($_POST[$name]){
		$result = $_POST[$name];
	}else if($_GET[$name]){
		$result = $_GET[$name];
	}

	return $result;
}

?>