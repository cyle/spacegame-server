<?php
// visualize the areas in the galaxy

/*

	connect to mongodb, get the areas, show them via canvas elements

*/

$m = new MongoClient("mongodb://spacegame.com");
$areas_db = $m->spacegame->areas;

$grid_scale = 1;

?>
<!doctype html>
<html>
<head>
</head>
<body>
<?php
$get_areas = $areas_db->find()->sort(array('_id' => 1));
foreach ($get_areas as $area) {
	//echo '<pre>'.print_r($area, true).'</pre>';
?>
<div>
<h2><?php echo $area['name']; ?> / <?php echo $area['_id']; ?></h2>
<canvas id="area-<?php echo $area['_id']; ?>" style="border:1px solid #ddd;background-color:#fff;" width="<?php echo $area['width'] * $grid_scale; ?>px" height="<?php echo $area['height'] * $grid_scale; ?>px"></canvas>
</div>
<script>
var canvas = document.getElementById('area-<?php echo $area['_id']; ?>');
var a = canvas.getContext('2d');
a.translate(canvas.width, canvas.height);
a.scale(-1, -1); // flip both because Babylon will render with bottom-right being x=0, y=0
<?php
	foreach ($area['stuff'] as $thing) {
		if ($thing['type'] == 'asteroid') {
			echo 'a.beginPath();'."\n";
			echo 'a.arc('.($thing['x'] * $grid_scale).', '.($thing['y'] * $grid_scale).', '.(($thing['model']['size']/2) * $grid_scale).', 0, 2 * Math.PI, false);'."\n";
			echo 'a.fillStyle = "#8B4513";'."\n";
			echo 'a.fill();'."\n";
			echo 'a.closePath();'."\n";
		} else if ($thing['type'] == 'safezone') {
			echo 'a.beginPath();'."\n";
			echo 'a.rect('.(($thing['x'] - $thing['width']/2) * $grid_scale).', '.(($thing['y'] - $thing['height']/2) * $grid_scale).', '.($thing['width'] * $grid_scale).', '.($thing['height'] * $grid_scale).');'."\n";
			echo 'a.fillStyle = "green";'."\n";
			echo 'a.fill();'."\n";
		} else if ($thing['type'] == 'nebula') {
			echo 'a.beginPath();'."\n";
			echo 'a.rect('.(($thing['x'] - $thing['width']/2) * $grid_scale).', '.(($thing['y'] - $thing['height']/2) * $grid_scale).', '.($thing['width'] * $grid_scale).', '.($thing['height'] * $grid_scale).');'."\n";
			echo 'a.fillStyle = "purple";'."\n";
			echo 'a.fill();'."\n";
		} else if ($thing['type'] == 'ionstorm') {
			echo 'a.beginPath();'."\n";
			echo 'a.rect('.(($thing['x'] - $thing['width']/2) * $grid_scale).', '.(($thing['y'] - $thing['height']/2) * $grid_scale).', '.($thing['width'] * $grid_scale).', '.($thing['height'] * $grid_scale).');'."\n";
			echo 'a.fillStyle = "#40E0D0";'."\n";
			echo 'a.fill();'."\n";
		} else if ($thing['type'] == 'station') {
			echo 'a.beginPath();'."\n";
			echo 'a.arc('.($thing['x'] * $grid_scale).', '.($thing['y'] * $grid_scale).', '.(($thing['model']['size']/2) * $grid_scale).', 0, 2 * Math.PI, false);'."\n";
			echo 'a.fillStyle = "#000080";'."\n";
			echo 'a.fill();'."\n";
			echo 'a.closePath();'."\n";
		} else {
			// uhhh...?
		}
	}
?>
</script>
<?php
} // end of area loop
?>
</body>
</html>
